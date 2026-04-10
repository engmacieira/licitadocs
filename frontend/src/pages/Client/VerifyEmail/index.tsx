import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import api from '../../../services/api';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Validando o seu e-mail...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Token de verificação ausente na URL.');
            return;
        }

        api.get(`/auth/verify-email?token=${token}`)
            .then((res) => {
                setStatus('success');
                setMessage(res.data.message || 'E-mail validado com sucesso!');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Token inválido ou expirado.');
            });
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
                <div className="flex justify-center mb-6">
                    {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {status === 'loading' ? 'Aguarde um momento...' :
                        status === 'success' ? 'Conta Verificada!' : 'Falha na Verificação'}
                </h1>

                <p className="text-slate-600 mb-8">{message}</p>

                {status !== 'loading' && (
                    <Button onClick={() => navigate('/login')} className="w-full">
                        <Mail className="mr-2 h-4 w-4" /> Ir para o Login
                    </Button>
                )}
            </div>
        </div>
    );
}