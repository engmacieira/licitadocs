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

/**
 * Orquestrador do fluxo de Login.
 * Gere a validação do formulário, a comunicação com o AuthContext (signIn),
 * a busca do perfil do utilizador e o redirecionamento pós-login.
 */
export function LoginOrchestrator() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const from = location.state?.from?.pathname || '/dashboard';

    /**
     * Processa a submissão do formulário, chama o serviço de autenticação
     * e redireciona o utilizador com base no seu nível de acesso (Role).
     * @param {LoginFormData} data - Credenciais inseridas pelo utilizador.
     */
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

            {/* --- LADO DIREITO: MARKETING / SOCIAL PROOF --- */}
            <LoginMarketingPanel />

        </div>
    );
}