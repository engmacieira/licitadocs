import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    Building2, User, Mail, Lock, CheckCircle2,
    ArrowRight, ArrowLeft, Briefcase, Upload, FileText, X
} from 'lucide-react';

// Auth
import { useAuth } from '../../contexts/AuthContext';

// Componentes UI
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Lógica
import { registerSchema } from '../../schemas/registerSchema';
import type { RegisterFormData } from '../../schemas/registerSchema';
import { authService } from '../../services/authService';

export function RegisterPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [step, setStep] = useState(1); // 1-Empresa, 2-Responsável, 3-Acesso, 4-Upload
    const [isLoading, setIsLoading] = useState(false);

    // Estados para os arquivos (Passo 4)
    const [socialContract, setSocialContract] = useState<File | null>(null);
    const [cnpjCard, setCnpjCard] = useState<File | null>(null);
    const [responsibleDoc, setResponsibleDoc] = useState<File | null>(null);

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

    // --- MÁSCARAS ---
    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        setValue('cnpj', value.substring(0, 18), { shouldValidate: true });
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
        setValue('cpf', value.substring(0, 14), { shouldValidate: true });
    };

    // --- NAVEGAÇÃO ---
    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['cnpj', 'legalName', 'tradeName'];
        if (step === 2) fieldsToValidate = ['responsibleName', 'cpf'];
        if (step === 3) fieldsToValidate = ['email', 'password', 'confirmPassword'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep((s) => s + 1);
    };

    // --- SUBMISSÃO ---
    async function onSubmit(data: RegisterFormData) {
        if (!socialContract || !cnpjCard || !responsibleDoc) {
            toast.error("Por favor, anexe todos os documentos obrigatórios.");
            return;
        }

        try {
            setIsLoading(true);

            // Limpeza de máscaras para garantir que o backend receba apenas números
            const cnpjClean = data.cnpj.replace(/\D/g, '');
            const cpfClean = data.cpf.replace(/\D/g, '');

            const formData = new FormData();

            // Mapeamento exato com o auth_router.py
            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('legal_name', data.legalName); // De legalName para legal_name

            if (data.tradeName) {
                formData.append('trade_name', data.tradeName); // De tradeName para trade_name
            }

            formData.append('cnpj', cnpjClean);
            formData.append('responsible_name', data.responsibleName); // De responsibleName para responsible_name
            formData.append('cpf', cpfClean); // De responsavel_cpf para cpf

            // Arquivos
            formData.append('social_contract', socialContract);
            formData.append('cnpj_card', cnpjCard);
            formData.append('responsible_doc', responsibleDoc); // Requer ajuste no backend conforme Passo 1

            await authService.register(formData);

            //AUTO-LOGIN
            await signIn({
                email: data.email,
                password: data.password
            });

            toast.success("Cadastro realizado!", {
                description: "Direcionando para assinatura digital..."
            });

            //NAVEGAÇÃO
            navigate('/contract-sign', { replace: true });

        } catch (error: any) {
            console.error("Erro no Registro:", error.response?.data);

            if (error.response?.status === 422) {
                // Isso mostrará exatamente qual campo o backend rejeitou
                toast.error("Erro de validação", {
                    description: "Verifique se o CNPJ e CPF estão corretos."
                });
            } else {
                toast.error("Erro ao criar conta", {
                    description: error.response?.data?.detail || "Verifique os dados ou tente outro e-mail."
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900">Crie sua conta</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Passo {step} de 4: <span className="font-medium text-slate-900">
                        {step === 1 ? 'Empresa' : step === 2 ? 'Responsável' : step === 3 ? 'Acesso' : 'Documentação'}
                    </span>
                </p>

                <div className="mt-6 flex justify-center gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-10 bg-blue-600' : 'w-3 bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100 relative">

                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-indigo-500" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* --- PASSO 1: DADOS DA EMPRESA --- */}
                        {step === 1 && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
                                <Input
                                    id="cnpj"
                                    label="CNPJ"
                                    placeholder="00.000.000/0000-00"
                                    icon={<Building2 className="h-5 w-5 text-slate-400" />}
                                    error={errors.cnpj?.message}
                                    {...register('cnpj')}
                                    onChange={handleCnpjChange} // Sobrescreve o onChange do register para aplicar máscara
                                    maxLength={18}
                                    autoFocus
                                />
                                <Input
                                    id="legalName"
                                    label="Razão Social"
                                    placeholder="Nome Legal da Empresa Ltda"
                                    icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                                    error={errors.legalName?.message}
                                    registration={register('legalName')}
                                />
                                <Input
                                    id="tradeName"
                                    label="Nome Fantasia (Opcional)"
                                    placeholder="Como a empresa é conhecida"
                                    icon={<Building2 className="h-5 w-5 text-slate-400" />}
                                    error={errors.tradeName?.message}
                                    registration={register('tradeName')}
                                />
                                <div className="pt-2">
                                    <Button type="button" onClick={nextStep} className="w-full">Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                </div>
                            </div>
                        )}

                        {/* --- PASSO 2: DADOS DO RESPONSÁVEL --- */}
                        {step === 2 && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
                                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
                                    <User className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Precisamos dos dados do responsável legal para validar a autenticidade da empresa na plataforma.
                                    </p>
                                </div>

                                <Input
                                    id="responsibleName"
                                    label="Nome Completo"
                                    placeholder="Ex: João da Silva"
                                    icon={<User className="h-5 w-5 text-slate-400" />}
                                    error={errors.responsibleName?.message}
                                    registration={register('responsibleName')}
                                    autoFocus
                                />
                                <Input
                                    id="cpf"
                                    label="CPF"
                                    placeholder="000.000.000-00"
                                    icon={<User className="h-5 w-5 text-slate-400" />}
                                    error={errors.cpf?.message}
                                    {...register('cpf')}
                                    onChange={handleCpfChange}
                                    maxLength={14}
                                />
                                <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3"><ArrowLeft /></Button><Button type="button" onClick={nextStep} className="w-2/3">Próximo <ArrowRight /></Button></div>
                            </div>
                        )}

                        {/* --- PASSO 3: CREDENCIAIS --- */}
                        {step === 3 && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
                                <Input
                                    id="email"
                                    label="E-mail Corporativo"
                                    type="email"
                                    placeholder="seu@email.com"
                                    icon={<Mail className="h-5 w-5 text-slate-400" />}
                                    error={errors.email?.message}
                                    registration={register('email')}
                                    autoFocus
                                />
                                <Input
                                    id="password"
                                    label="Criar Senha"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    icon={<Lock className="h-5 w-5 text-slate-400" />}
                                    error={errors.password?.message}
                                    registration={register('password')}
                                />
                                <Input
                                    id="confirmPassword"
                                    label="Confirmar Senha"
                                    type="password"
                                    placeholder="Repita a senha"
                                    icon={<CheckCircle2 className="h-5 w-5 text-slate-400" />}
                                    error={errors.confirmPassword?.message}
                                    registration={register('confirmPassword')}
                                />
                                <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3"><ArrowLeft /></Button><Button type="button" onClick={nextStep} className="w-2/3">Próximo <ArrowRight /></Button></div>
                            </div>
                        )}

                        {/* --- PASSO 4: UPLOAD DE DOCUMENTOS (KYC) --- */}
                        {step === 4 && (
                            <div className="space-y-5 animate-in slide-in-from-right duration-300">
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3 items-start">
                                    <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        Anexe os documentos originais (PDF ou Imagem) para que nossa equipe valide seu acesso à plataforma.
                                    </p>
                                </div>

                                <FileField label="Contrato Social Atualizado" file={socialContract} setFile={setSocialContract} id="social" />
                                <FileField label="Cartão CNPJ (Emitido nos últimos 30 dias)" file={cnpjCard} setFile={setCnpjCard} id="cnpj" />
                                <FileField label="Documento com Foto (RG/CNH do Responsável)" file={responsibleDoc} setFile={setResponsibleDoc} id="doc" />

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-1/3" disabled={isLoading}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button type="submit" variant="primary" className="w-2/3 shadow-lg shadow-blue-500/20" isLoading={isLoading}>
                                        Finalizar Cadastro
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE DE UPLOAD (UX Polished) ---
function FileField({ label, file, setFile, id }: { label: string, file: File | null, setFile: (f: File | null) => void, id: string }) {
    return (
        <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">{label}</span>
            <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'}`}>
                <input
                    type="file" id={id} className="hidden" accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-green-800 truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-green-100 rounded text-green-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-2">
                        <Upload className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-xs font-medium text-slate-500">Clique para anexar arquivo</span>
                    </label>
                )}
            </div>
        </div>
    );
}