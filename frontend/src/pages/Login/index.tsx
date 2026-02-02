import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import api from '../../services/api'; // Importamos a API para checar a role

// Validação do Formulário
const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function handleLogin(data: LoginFormData) {
        try {
            setLoading(true);
            setErrorMessage('');

            // 1. Realiza o Login (Pega o Token)
            await signIn(data);

            // 2. Busca os dados do usuário para saber quem é (Role)
            // O signIn guarda o token, então essa requisição já vai autenticada
            const response = await api.get('/users/me');
            const user = response.data;

            // 3. O "Semáforo" de Redirecionamento
            if (user.role === 'admin') {
                navigate('/admin/dashboard'); // Sala de Comando
            } else {
                navigate('/dashboard');       // Cofre do Cliente
            }

        } catch (error) {
            console.error(error);
            setErrorMessage('E-mail ou senha incorretos.');
            setLoading(false); // Só para o loading se der erro. Se der certo, deixa rodando enquanto navega.
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Lado Esquerdo - Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                    <span className="text-xl font-bold">LicitaDoc</span>
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-4">Gestão de Documentos para Licitações.</h1>
                    <p className="text-slate-400 text-lg">
                        Nós cuidamos da burocracia. Você foca em ganhar os contratos.
                    </p>
                </div>
                <p className="text-sm text-slate-600">© 2026 LicitaDoc Inc.</p>
            </div>

            {/* Lado Direito - Formulário */}
            <div className="flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Acesse sua conta</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Entre para visualizar seus documentos
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">

                        {/* Input E-mail */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">E-mail corporativo</label>
                            <input
                                {...register('email')}
                                type="email"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="seu@email.com"
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                        </div>

                        {/* Input Senha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Senha</label>
                            <input
                                {...register('password')}
                                type="password"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                        </div>

                        {/* Mensagem de Erro Geral */}
                        {errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                        >
                            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Ainda não tem conta?{' '}
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Criar conta (Teste)
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}