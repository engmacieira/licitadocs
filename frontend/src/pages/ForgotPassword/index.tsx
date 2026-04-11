import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(res.data.message || 'Instruções enviadas para o seu e-mail.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Erro ao processar a solicitação.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifique o seu e-mail</h1>
                    <p className="text-slate-600 mb-8">{message}</p>
                    <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
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
                        <KeyRound className="h-8 w-8" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Esqueceu a senha?</h1>
                <p className="text-slate-600 text-center mb-8 text-sm">
                    Digite o e-mail associado à sua conta e enviaremos um link seguro para redefini-la.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de acesso</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="seu@email.com.br"
                                required
                            />
                        </div>
                    </div>

                    {status === 'error' && (
                        <p className="text-red-500 text-sm font-medium">{message}</p>
                    )}

                    <Button type="submit" disabled={status === 'loading'} className="w-full">
                        {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enviar link de recuperação'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center justify-center w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                    </button>
                </div>
            </div>
        </div>
    );
}