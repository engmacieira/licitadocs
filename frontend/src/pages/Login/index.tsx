import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Lock, LayoutTemplate } from 'lucide-react'; // Ícones novos
import api from '../../services/api';

// Componentes UI Refatorados
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Validação do Formulário (Zod)
const loginSchema = z.object({
    email: z.string().email('Digite um e-mail válido'),
    password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function handleLogin(data: LoginFormData) {
        try {
            setLoading(true);

            // 1. Realiza o Login (Obtém Token)
            await signIn(data);

            // 2. Verifica Role para Redirecionamento (O "Semáforo")
            const response = await api.get('/users/me');
            const user = response.data;

            // Feedback positivo sutil
            toast.success(`Bem-vindo de volta, ${user.name || 'Usuário'}!`);

            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error: any) {
            console.error(error);
            // UX: Feedback de Erro via Toast
            // Se o backend retornar mensagem específica, usamos ela, senão msg genérica
            const msg = error.response?.data?.detail || "Verifique suas credenciais e tente novamente.";

            toast.error("Falha ao entrar", {
                description: msg,
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

            {/* Cabeçalho da Página */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <LayoutTemplate size={24} />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
                    LicitaDoc
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Gestão inteligente de documentos e certidões.
                </p>
            </div>

            {/* Card de Login */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">

                    <form className="space-y-6" onSubmit={handleSubmit(handleLogin)}>

                        {/* Input de E-mail */}
                        <Input
                            label="E-mail Corporativo"
                            type="email"
                            placeholder="seu@email.com"
                            icon={<Mail size={18} />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        {/* Input de Senha */}
                        <div className="space-y-1">
                            <Input
                                label="Senha de Acesso"
                                type="password"
                                placeholder="••••••••"
                                icon={<Lock size={18} />}
                                error={errors.password?.message}
                                {...register('password')}
                            />
                            <div className="flex items-center justify-end">
                                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                                    Esqueceu a senha?
                                </a>
                            </div>
                        </div>

                        {/* Botão de Ação */}
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full"
                            size="lg" // Botão maior para login
                        >
                            Entrar na Plataforma
                        </Button>
                    </form>

                    {/* Footer do Card */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">
                                    Novo por aqui?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/register"
                                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Criar uma conta de teste
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <p className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2024 LicitaDoc. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}