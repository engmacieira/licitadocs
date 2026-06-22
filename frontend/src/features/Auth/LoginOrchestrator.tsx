import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';

// Integrações
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { loginSchema } from '../../schemas/loginSchema';
import type { LoginFormData } from '../../schemas/loginSchema';

// Componentes UI
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// Subcomponente Visual (Painel Direito)
import { LoginMarketingPanel } from './components/LoginMarketingPanel';

export function LoginOrchestrator() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- OAUTH: IMPORTANDO A NOVA FUNÇÃO signInWithProvider ---
    const { signIn, signInWithProvider } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    // --- OAUTH: ESTADOS DE LOADING INDIVIDUAIS PARA OS BOTÕES SOCIAIS ---
    const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'azure' | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const from = location.state?.from?.pathname || '/dashboard';

    async function handleLogin(data: LoginFormData) {
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

    // --- OAUTH: FUNÇÃO HANDLER PARA LOGIN SOCIAL ---
    async function handleSocialLogin(provider: 'google' | 'azure') {
        try {
            setIsSocialLoading(provider);
            // O redirecionamento acontece no nível do Supabase, o usuário sairá da tela.
            await signInWithProvider(provider);
        } catch (error) {
            console.error(error);
            toast.error('Erro na autenticação social', {
                description: 'Não foi possível conectar com o provedor selecionado.'
            });
            setIsSocialLoading(null);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">

            {/* --- LADO ESQUERDO: ÁREA DE INTERAÇÃO --- */}
            <div className="relative flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
                <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                        aria-label="Voltar para a página inicial"
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

                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6" noValidate>
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

                        <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-blue-600/20" disabled={isLoading || isSocialLoading !== null}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                            Entrar na Plataforma
                        </Button>
                    </form>

                    {/* --- OAUTH: DIVISOR VISUAL --- */}
                    <div className="relative mt-8 mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-slate-500 font-medium">Ou continue com</span>
                        </div>
                    </div>

                    {/* --- OAUTH: BOTÕES DE LOGIN SOCIAL --- */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 bg-white hover:bg-slate-50 border-slate-200"
                            disabled={isLoading || isSocialLoading !== null}
                            onClick={() => handleSocialLogin('google')}
                        >
                            {isSocialLoading === 'google' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                            ) : (
                                <>
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 bg-white hover:bg-slate-50 border-slate-200"
                            disabled={isLoading || isSocialLoading !== null}
                            onClick={() => handleSocialLogin('azure')}
                        >
                            {isSocialLoading === 'azure' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                            ) : (
                                <>
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21">
                                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                    </svg>
                                    Microsoft
                                </>
                            )}
                        </Button>
                    </div>

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

            {/* --- LADO DIREITO: MARKETING / SOCIAL PROOF --- */}
            <LoginMarketingPanel />

        </div>
    );
}