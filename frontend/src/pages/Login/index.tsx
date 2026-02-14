import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

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
        try {
            setIsLoading(true);

            // 1. Realiza o Login (Salva o token)
            await signIn(data);

            // 2. Verifica QUEM logou para decidir o destino
            // Buscamos o perfil atualizado do usuário
            const userProfile = await userService.getMe();

            toast.success(`Bem-vindo de volta!`);

            // 3. Roteamento Inteligente
            if (userProfile.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                // Se for cliente, vai para o dashboard normal ou para a página que tentou acessar
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
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Lado Esquerdo: Formulário (Mantido Igual) */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-left-4 duration-500">
                    <div className="space-y-2 text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto flex items-center justify-center mb-4">
                            <Lock className="text-white h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acesse sua conta</h1>
                        <p className="text-sm text-slate-500">Entre com suas credenciais para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                label="E-mail"
                                type="email"
                                placeholder="seu@email.com"
                                icon={<Mail className="h-4 w-4 text-slate-400" />}
                                error={errors.email?.message}
                                {...register('email')}
                            />
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">Senha</label>
                                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    icon={<Lock className="h-4 w-4 text-slate-400" />}
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                            Entrar na Plataforma
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-600">
                        Ainda não tem uma conta?{' '}
                        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>

            {/* Lado Direito: Banner (Mantido Igual) */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 to-purple-600/20" />
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-3xl font-bold text-white mb-6">Automação inteligente para suas licitações</h2>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Gerencie certidões, monitore vencimentos e mantenha sua empresa sempre pronta para licitar com nossa tecnologia exclusiva.
                    </p>
                </div>
            </div>
        </div>
    );
}