import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeft, Building2 } from 'lucide-react';

// Auth e Serviços
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { registerSchema } from '../../schemas/registerSchema';
import type { RegisterFormData } from '../../schemas/registerSchema';

// Subcomponentes Visuais (Vamos criá-los no próximo passo!)
import { ValuePropositionPanel } from './components/ValuePropositionPanel';
import { Step1Company } from './components/Step1Company';
import { Step2Responsible } from './components/Step2Responsible';
import { Step3Credentials } from './components/Step3Credentials';
import { Step4Uploads } from './components/Step4Uploads';

/**
 * Componente orquestrador do fluxo de Registo (Onboarding).
 * Gere o estado dos passos (Wizard), a validação do formulário com Zod, 
 * as máscaras de input e a comunicação com a API para a criação da conta.
 */
export function RegisterWizard() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    // --- ESTADOS DO WIZARD ---
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS DE FICHEIROS ---
    const [socialContract, setSocialContract] = useState<File | null>(null);
    const [cnpjCard, setCnpjCard] = useState<File | null>(null);
    const [responsibleDoc, setResponsibleDoc] = useState<File | null>(null);
    const [proxyDoc, setProxyDoc] = useState<File | null>(null);

    // --- CONFIGURAÇÃO DO FORMULÁRIO ---
    const {
        register,
        handleSubmit,
        trigger,
        setValue,
        formState: { errors }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    });

    /**
     * Aplica a máscara de formatação para o input de CNPJ (00.000.000/0000-00).
     */
    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        setValue('cnpj', value.substring(0, 18), { shouldValidate: true });
    };

    /**
     * Aplica a máscara de formatação para o input de CPF (000.000.000-00).
     */
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
        setValue('cpf', value.substring(0, 14), { shouldValidate: true });
    };

    /**
     * Valida os campos do passo atual antes de permitir avançar.
     */
    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['cnpj', 'legalName', 'tradeName'];
        if (step === 2) fieldsToValidate = ['responsibleName', 'cpf'];
        if (step === 3) fieldsToValidate = ['email', 'password', 'confirmPassword'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep((s) => s + 1);
    };

    /**
     * Submissão final enviando os ficheiros e dados para a API.
     */
    async function onSubmit(data: RegisterFormData) {
        if (!socialContract || !cnpjCard || !responsibleDoc) {
            toast.error("Por favor, anexe todos os documentos obrigatórios.");
            return;
        }

        try {
            setIsLoading(true);

            // Toast informativo para o usuário saber que o processo começou (útil em redes lentas)
            toast.info("Processando seu cadastro...", {
                description: "Isso pode levar alguns segundos dependendo da sua conexão.",
                duration: 5000 // Fica visível por 5 segundos
            });

            const cnpjClean = data.cnpj.replace(/\D/g, '');
            const cpfClean = data.cpf.replace(/\D/g, '');

            const formData = new FormData();
            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('legal_name', data.legalName);
            if (data.tradeName) formData.append('trade_name', data.tradeName);
            formData.append('cnpj', cnpjClean);
            formData.append('responsible_name', data.responsibleName);
            formData.append('nome', data.responsibleName);
            formData.append('cpf', cpfClean);
            formData.append('social_contract', socialContract);
            formData.append('cnpj_card', cnpjCard);
            formData.append('responsible_doc', responsibleDoc);
            if (proxyDoc) formData.append('proxy_doc', proxyDoc);

            await authService.register(formData);
            await signIn({ email: data.email, password: data.password });

            toast.success("Cadastro realizado!", { description: "Direcionando para assinatura digital..." });
            navigate('/contract-sign', { replace: true });

        } catch (error: any) {
            console.error("Erro no Registro:", error);

            // 1. Tratamento específico para Timeout ou Erro de Rede (Axios)
            // Quando a rede corta, error.response geralmente é undefined e error.code é ECONNABORTED ou ERR_NETWORK
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Network Error')) {
                toast.error("Conexão instável ou muito lenta.", {
                    description: "Seu cadastro demorou muito para responder. Por favor, verifique sua conexão corporativa ou tente novamente mais tarde."
                });
            }
            // 2. Erro de Validação de Dados (Retorno do Backend)
            else if (error.response?.status === 422) {
                toast.error("Erro de validação", { description: "Verifique se o CNPJ e CPF estão corretos." });
            }
            // 3. Arquivo muito grande (Retorno do Backend 413 Payload Too Large)
            else if (error.response?.status === 413) {
                toast.error("Arquivo muito grande", { description: "Um dos documentos excede o limite de 5MB." });
            }
            // 4. Erro de E-mail ou CNPJ Duplicado (Retorno 400 do Backend)
            else if (error.response?.status === 400) {
                toast.error("Erro no cadastro", { description: error.response?.data?.detail });
            }
            // 5. Erro Genérico (Fallback)
            else {
                toast.error("Erro ao criar conta", { description: "Ocorreu um erro inesperado. Tente novamente." });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">

            {/* --- LADO ESQUERDO: WIZARD DE REGISTO --- */}
            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">
                <div className="absolute top-8 left-6 sm:left-12 lg:left-16">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o site
                    </button>
                </div>

                <div className="w-full max-w-md mx-auto mt-12">

                    {/* Cabeçalho do Stepper */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-blue-600 h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Crie sua conta
                        </h1>
                        <p className="text-sm text-slate-600 mb-6">
                            Passo {step} de 4: <span className="font-bold text-slate-900">
                                {step === 1 ? 'Empresa' : step === 2 ? 'Responsável' : step === 3 ? 'Acesso' : 'Documentação'}
                            </span>
                        </p>

                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-10 bg-blue-600' : 'w-3 bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Formulário Interativo Modularizado */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                            <Step1Company register={register} errors={errors} handleCnpjChange={handleCnpjChange} nextStep={nextStep} />
                        )}
                        {step === 2 && (
                            <Step2Responsible register={register} errors={errors} handleCpfChange={handleCpfChange} nextStep={nextStep} setStep={setStep} />
                        )}
                        {step === 3 && (
                            <Step3Credentials register={register} errors={errors} nextStep={nextStep} setStep={setStep} />
                        )}
                        {step === 4 && (
                            <Step4Uploads
                                setStep={setStep} isLoading={isLoading}
                                files={{ socialContract, cnpjCard, responsibleDoc, proxyDoc }}
                                setFiles={{ setSocialContract, setCnpjCard, setResponsibleDoc, setProxyDoc }}
                            />
                        )}
                    </form>

                    {/* Link para Login */}
                    <div className="pt-8 text-center">
                        <p className="text-sm text-slate-600">
                            Já possui uma conta?{' '}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- LADO DIREITO: MARKETING --- */}
            <ValuePropositionPanel />
        </div>
    );
}