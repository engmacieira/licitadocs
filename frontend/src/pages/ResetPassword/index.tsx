import { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Se o usuário acessar a rota sem token, redireciona para o login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setStatus('error');
            setMessage('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('As senhas não coincidem.');
            return;
        }

        setStatus('loading');
        try {
            const res = await api.post('/auth/reset-password', {
                token,
                new_password: password
            });
            setStatus('success');
            setMessage(res.data.message || 'Senha redefinida com sucesso!');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.detail || 'O link expirou ou é inválido.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Tudo Certo!</h1>
                    <p className="text-slate-600 mb-8">{message}</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        Fazer Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                        <Lock className="h-8 w-8" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Criar Nova Senha</h1>
                <p className="text-slate-600 text-center mb-8 text-sm">
                    Sua nova senha deve ter no mínimo 8 caracteres.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm font-medium">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>{message}</p>
                        </div>
                    )}

                    <Button type="submit" disabled={status === 'loading'} className="w-full mt-2">
                        {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Redefinir Senha'}
                    </Button>
                </form>
            </div>
        </div>
    );
}