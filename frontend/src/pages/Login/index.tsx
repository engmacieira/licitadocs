import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Lock, LayoutTemplate } from 'lucide-react'; // Seus ícones originais
import api from '../../services/api';

// Componentes UI
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
    // O loading pode vir do hook useAuth ou local, mantive local como no seu código para não quebrar layout
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function handleLogin(data: LoginFormData) {
        try {
            setLoading(true);

            // 1. Realiza o Login (Obtém Token e salva no Contexto)
            await signIn({
                email: data.email,
                password: data.password
            });

            // 2. O "Semáforo": Verifica Role para Redirecionamento (Sua lógica original)
            // Como o signIn já configurou o header Authorization, essa chamada funciona
            const response = await api.get('/users/me');
            const user = response.data;

            toast.success(`Bem-vindo de volta, ${user.email.split('@')[0]}!`);

            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error: any) {
            console.error("Erro no login:", error);

            // Tratamento de erros baseado no status do Backend novo
            const status = error.response?.status;

            if (status === 401) {
                toast.error("Credenciais inválidas.", {
                    description: "Verifique seu e-mail e senha."
                });
            } else if (status === 403) {
                toast.error("Acesso negado.", {
                    description: "Sua conta pode estar inativa ou bloqueada."
                });
            } else {
                toast.error("Erro ao entrar.", {
                    description: "Não foi possível conectar ao servidor. Tente novamente."
                });
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo ou Ícone Principal */}
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <LayoutTemplate className="h-6 w-6 text-blue-600" />
                </div>

                <h2 className="text-center text-3xl font-extrabold text-slate-900">
                    Acessar Plataforma
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Gerencie suas certidões com inteligência
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">

                        <Input
                            label="E-mail Corporativo"
                            placeholder="seu@email.com"
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                        // Se o seu Input suportar ícones, você usaria o <Mail /> aqui
                        />

                        <div>
                            <Input
                                label="Senha"
                                placeholder="••••••••"
                                type="password"
                                {...register('password')}
                                error={errors.password?.message}
                            // Se o seu Input suportar ícones, você usaria o <Lock /> aqui
                            />
                            <div className="flex justify-end mt-1">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            isLoading={loading} // Se seu Button tiver prop isLoading
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