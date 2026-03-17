import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Loader2, ChevronLeft, ShieldCheck, FileText, CheckCircle2, Clock } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { loginSchema } from '../../schemas/loginSchema';
import type { LoginFormData } from '../../schemas/loginSchema';
// Importamos o userService para checar quem logou
import { userService } from '../../services/userService';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const from = location.state?.from?.pathname || '/dashboard';

    async function handleLogin(data: LoginFormData) {
        // ... (lógica de login mantida exatamente igual)
        try {
            setIsLoading(true);
            await signIn(data);
            const userProfile = await userService.getMe();
            toast.success(`Bem-vindo de volta!`);
            if (userProfile.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate(from === '/admin/dashboard' ? '/dashboard' : from, { replace: true });
            }
        } catch (error) {
            console.error(error);
            toast.error('Credenciais inválidas', {
                description: 'Verifique seu e-mail e senha e tente novamente.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">

            {/* --- LADO ESQUERDO: ÁREA DE INTERAÇÃO (Mantido do Redesign Anterior) --- */}
            <div className="relative flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
                <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o site
                    </button>
                </div>

                <div className="w-full max-w-sm mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500 mt-12">
                    <div className="space-y-3">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <Lock className="text-blue-600 h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Acesse sua conta
                        </h1>
                        <p className="text-base text-slate-500">
                            Bem-vindo de volta à sua central de automação.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
                        <div className="space-y-5">
                            <Input
                                id="email"
                                label="E-mail"
                                type="email"
                                placeholder="seu@email.com"
                                icon={<Mail className="h-4 w-4 text-slate-400" />}
                                error={errors.email?.message}
                                {...register('email')}
                            />
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                                        Senha
                                    </label>
                                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={<Lock className="h-4 w-4 text-slate-400" />}
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-blue-600/20" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                            Entrar na Plataforma
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-600">
                            Precisa automatizar suas licitações?{' '}
                            <Link to="/demonstracao" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                                Conheça a plataforma
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- LADO DIREITO: SOCIAL PROOF E DIFERENCIAL CLARO (UX) --- */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-slate-950 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-lg mx-auto w-full">
                    {/* Card Simulando a Interface */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-10 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-green-400" />
                                <span className="font-semibold text-white">Status do CNPJ</span>
                            </div>
                            <span className="text-xs font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                                100% REGULAR
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm font-medium text-slate-200">CND Federal (Receita)</span>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                </div>
                                {/* Microtexto provando a automação */}
                                <div className="flex items-center gap-1.5 pl-6">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <span className="text-[10px] text-slate-400">Renovada automaticamente hoje às 08:15</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Texto de Impacto Focado no Diferencial */}
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        Muito mais que um <br /> cofre digital.
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Esqueça os alertas que só te dão trabalho. Nosso sistema busca e emite suas novas certidões automaticamente antes do vencimento.
                    </p>
                </div>
            </div>
        </div>
    );
}