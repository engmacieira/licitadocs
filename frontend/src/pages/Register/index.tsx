import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    Building2, User, Mail, Lock, CheckCircle2,
    ArrowRight, ArrowLeft, Briefcase, Upload, FileText, X,
    ChevronLeft, ShieldCheck, Zap
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

    // Lógica Original Mantida Intacta
    const [step, setStep] = useState(1); // 1-Empresa, 2-Responsável, 3-Acesso, 4-Upload
    const [isLoading, setIsLoading] = useState(false);

    const [socialContract, setSocialContract] = useState<File | null>(null);
    const [cnpjCard, setCnpjCard] = useState<File | null>(null);
    const [responsibleDoc, setResponsibleDoc] = useState<File | null>(null);
    const [proxyDoc, setProxyDoc] = useState<File | null>(null);

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

            const cnpjClean = data.cnpj.replace(/\D/g, '');
            const cpfClean = data.cpf.replace(/\D/g, '');

            const formData = new FormData();

            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('legal_name', data.legalName);

            if (data.tradeName) {
                formData.append('trade_name', data.tradeName);
            }

            formData.append('cnpj', cnpjClean);
            formData.append('responsible_name', data.responsibleName);
            formData.append('nome', data.responsibleName);
            formData.append('cpf', cpfClean);

            formData.append('social_contract', socialContract);
            formData.append('cnpj_card', cnpjCard);
            formData.append('responsible_doc', responsibleDoc);

            if (proxyDoc) {
                formData.append('proxy_doc', proxyDoc);
            }

            await authService.register(formData);

            await signIn({
                email: data.email,
                password: data.password
            });

            toast.success("Cadastro realizado!", {
                description: "Direcionando para assinatura digital..."
            });

            navigate('/contract-sign', { replace: true });

        } catch (error: any) {
            console.error("Erro no Registro:", error.response?.data);

            if (error.response?.status === 422) {
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
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">

            {/* --- LADO ESQUERDO: ÁREA DE INTERAÇÃO (Formulário Multi-Step) --- */}
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

                    {/* Cabeçalho e Stepper */}
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
                                    onChange={handleCnpjChange}
                                    maxLength={18}
                                    autoFocus
                                />
                                <Input
                                    id="legalName"
                                    label="Razão Social"
                                    placeholder="Nome Legal da Empresa Ltda"
                                    icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                                    error={errors.legalName?.message}
                                    {...register('legalName')}
                                />
                                <Input
                                    id="tradeName"
                                    label="Nome Fantasia (Opcional)"
                                    placeholder="Como a empresa é conhecida"
                                    icon={<Building2 className="h-5 w-5 text-slate-400" />}
                                    error={errors.tradeName?.message}
                                    {...register('tradeName')}
                                />
                                <div className="pt-2">
                                    <Button type="button" onClick={nextStep} className="w-full h-12">
                                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* --- PASSO 2: DADOS DO RESPONSÁVEL --- */}
                        {step === 2 && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
                                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                                    <User className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Precisamos dos dados do responsável legal para validar a autenticidade da empresa na plataforma.
                                    </p>
                                </div>

                                <Input
                                    id="responsibleName"
                                    label="Nome Completo"
                                    placeholder="Ex: João da Silva"
                                    icon={<User className="h-5 w-5 text-slate-400" />}
                                    error={errors.responsibleName?.message}
                                    {...register('responsibleName')}
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
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 h-12">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="w-2/3 h-12">
                                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
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
                                    {...register('email')}
                                    autoFocus
                                />
                                <Input
                                    id="password"
                                    label="Criar Senha"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    icon={<Lock className="h-5 w-5 text-slate-400" />}
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                                <Input
                                    id="confirmPassword"
                                    label="Confirmar Senha"
                                    type="password"
                                    placeholder="Repita a senha"
                                    icon={<CheckCircle2 className="h-5 w-5 text-slate-400" />}
                                    error={errors.confirmPassword?.message}
                                    {...register('confirmPassword')}
                                />
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3 h-12">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="w-2/3 h-12">
                                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* --- PASSO 4: UPLOAD DE DOCUMENTOS --- */}
                        {step === 4 && (
                            <div className="space-y-5 animate-in slide-in-from-right duration-300">
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                                    <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        Anexe os documentos (PDF ou Imagem) para que nossa equipe valide seu acesso.
                                    </p>
                                </div>

                                <FileField label="Contrato Social Atualizado" file={socialContract} setFile={setSocialContract} id="social" />
                                <FileField label="Cartão CNPJ (Emitido nos últimos 30 dias)" file={cnpjCard} setFile={setCnpjCard} id="cnpj" />
                                <FileField label="Documento com Foto (RG/CNH do Responsável)" file={responsibleDoc} setFile={setResponsibleDoc} id="doc" />
                                <FileField label="Procuração (Opcional)" file={proxyDoc} setFile={setProxyDoc} id="proxy" />

                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-1/3 h-12" disabled={isLoading}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button type="submit" className="w-2/3 h-12 shadow-lg shadow-blue-600/20" disabled={isLoading}>
                                        {isLoading ? <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full h-4 w-4"></span> : null}
                                        Finalizar Cadastro
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>

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

            {/* --- LADO DIREITO: EXPECTATIVAS E VALOR (UX Premium) --- */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-slate-950 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-lg mx-auto w-full">
                    <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                        Você está a um passo de <br /> simplificar sua rotina.
                    </h2>

                    {/* Card de Resumo do Plano (Transparência de Preço) */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <Zap className="h-6 w-6 text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-white">LicitaDocs Anual</h3>
                                <p className="text-xs text-blue-300">Licença atrelada a 1 CNPJ</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                <span className="text-sm text-slate-300">Busca e renovação automática de certidões federais, estaduais e municipais.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                <span className="text-sm text-slate-300">Alertas imediatos em caso de pendências fiscais.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                <span className="text-sm text-slate-300">Cofre digital seguro com modelos padronizados.</span>
                            </div>
                        </div>

                        {/* Destacando o valor real sem enganação */}
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">Investimento</span>
                            <div className="text-right">
                                <div className="text-white font-bold text-xl">R$ 178,80<span className="text-sm text-slate-400 font-normal">/ano</span></div>
                                <div className="text-xs text-blue-400">Equivale a apenas R$ 14,90/mês</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <ShieldCheck className="h-5 w-5 text-slate-500" />
                        <span>Seus dados são criptografados e enviados com segurança.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE DE UPLOAD (UX Polished mantido do original) ---
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