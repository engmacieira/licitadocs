// ... (Mantenha os imports e código anteriores)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, ArrowLeft, CheckCircle, FileText, Building2, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { registerSchema } from '../../schemas/registerSchema';
import type { RegisterFormData } from '../../schemas/registerSchema';
import { toast } from 'sonner';
import api from '../../services/api';

export function RegisterPage() {
    const navigate = useNavigate();
    // ... (Estados e Hooks mantidos iguais) ...
    const [step, setStep] = useState(1);
    const [socialContract, setSocialContract] = useState<File | null>(null);
    const [cnpjCard, setCnpjCard] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const handleNextStep = async () => {
        const isValid = await trigger(['cnpj', 'legalName', 'responsibleName', 'cpf', 'email', 'password', 'confirmPassword']);
        if (isValid) {
            setStep(2);
        }
    };

    const onSubmit = async (data: RegisterFormData) => {
        if (!socialContract || !cnpjCard) {
            toast.error("Por favor, anexe os documentos obrigatórios.");
            return;
        }

        try {
            const formData = new FormData();

            // Dados da Empresa
            formData.append('cnpj', data.cnpj);
            formData.append('legal_name', data.legalName);
            if (data.tradeName) formData.append('trade_name', data.tradeName);

            // Dados do Responsável
            formData.append('responsible_name', data.responsibleName);
            formData.append('cpf', data.cpf);

            // Dados de Login
            formData.append('email', data.email);
            formData.append('password', data.password);

            // Arquivos
            formData.append('social_contract', socialContract);
            formData.append('cnpj_card', cnpjCard);

            await api.post('/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success("Cadastro realizado! Vamos para a formalização.");

            // [MUDANÇA AQUI] Redireciona para o Contrato levando os dados
            setTimeout(() => {
                navigate('/contract', {
                    state: {
                        email: data.email,
                        legalName: data.legalName,
                        responsibleName: data.responsibleName
                    }
                });
            }, 1000);

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro de conexão com o servidor.";
            toast.error(msg);
        }
    };

    // ... (O restante do JSX do return permanece IDÊNTICO ao anterior) ...
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Nova Conta Empresarial
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Passo {step} de 2: {step === 1 ? 'Dados Cadastrais' : 'Documentação Inicial'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Copie o JSX do arquivo anterior para manter o formulário igual */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-blue-50 p-3 rounded-md mb-4">
                                    <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" /> Dados da Empresa
                                    </h3>
                                </div>
                                <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('cnpj')} error={errors.cnpj?.message} />
                                <Input label="Razão Social" placeholder="Sua Empresa LTDA" {...register('legalName')} error={errors.legalName?.message} />
                                <Input label="Nome Fantasia (Opcional)" placeholder="Nome da Marca" {...register('tradeName')} error={errors.tradeName?.message} />

                                <div className="bg-blue-50 p-3 rounded-md mt-6 mb-4">
                                    <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                        <User className="w-4 h-4 mr-2" /> Dados do Responsável
                                    </h3>
                                </div>
                                <Input label="Nome Completo" placeholder="Nome do Sócio ou Admin" {...register('responsibleName')} error={errors.responsibleName?.message} />
                                <Input label="CPF" placeholder="000.000.000-00" {...register('cpf')} error={errors.cpf?.message} />

                                <Input label="E-mail de Acesso" type="email" placeholder="admin@suaempresa.com" {...register('email')} error={errors.email?.message} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Senha" type="password" {...register('password')} error={errors.password?.message} />
                                    <Input label="Confirmar Senha" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
                                </div>
                                <div className="pt-4">
                                    <Button type="button" className="w-full" onClick={handleNextStep}>Próximo: Anexar Documentos <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Componentes de Upload iguais ao anterior */}
                                <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <Building2 className="h-10 w-10 text-slate-400 mb-2" />
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contrato Social</label>
                                        <p className="text-xs text-slate-500 mb-3">PDF até 10MB</p>
                                        <input type="file" id="social-contract" className="hidden" accept=".pdf" onChange={(e) => setSocialContract(e.target.files?.[0] || null)} />
                                        {!socialContract ? (
                                            <label htmlFor="social-contract" className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"><Upload className="mr-2 h-4 w-4" /> Selecionar Arquivo</label>
                                        ) : (
                                            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1" /> {socialContract.name.substring(0, 20)}... <button type="button" onClick={() => setSocialContract(null)} className="ml-2 text-red-500 hover:text-red-700 text-xs underline">Remover</button></div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <FileText className="h-10 w-10 text-slate-400 mb-2" />
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cartão CNPJ</label>
                                        <p className="text-xs text-slate-500 mb-3">PDF recente</p>
                                        <input type="file" id="cnpj-card" className="hidden" accept=".pdf" onChange={(e) => setCnpjCard(e.target.files?.[0] || null)} />
                                        {!cnpjCard ? (
                                            <label htmlFor="cnpj-card" className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"><Upload className="mr-2 h-4 w-4" /> Selecionar Arquivo</label>
                                        ) : (
                                            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1" /> {cnpjCard.name.substring(0, 20)}... <button type="button" onClick={() => setCnpjCard(null)} className="ml-2 text-red-500 hover:text-red-700 text-xs underline">Remover</button></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                                    <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}</Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-slate-500">
                    Já é cliente? <button onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:text-blue-500">Fazer login</button>
                </p>
            </div>
        </div>
    );
}