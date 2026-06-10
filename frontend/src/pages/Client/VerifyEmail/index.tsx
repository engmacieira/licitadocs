import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';
import api from '../../../services/api';

/**
 * Página de Verificação de E-mail
 * Refatorada para permitir o reenvio de link em caso de erro/expiração e redirecionamento automático.
 */
export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Estados de UI
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Validando o seu e-mail...');
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(3);

    const token = searchParams.get('token');

    // Efeito inicial para validar o token assim que a página carrega
    useEffect(() => {
        let isMounted = true;

        if (!token) {
            setStatus('error');
            setMessage('Token de verificação ausente na URL.');
            return;
        }

        api.get(`/auth/verify-email?token=${token}`)
            .then((res) => {
                if (isMounted) {
                    setStatus('success');
                    setMessage(res.data.message || 'E-mail validado com sucesso!');
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setStatus('error');
                    setMessage(err.response?.data?.detail || 'Este link de verificação expirou ou é inválido.');
                }
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Efeito para o countdown de redirecionamento em caso de sucesso
    useEffect(() => {
        if (status === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/login');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status, navigate]);

    /**
     * Função para solicitar um novo link de validação diretamente da tela de erro
     */
    const handleResendFromPage = async () => {
        setIsResending(true);
        const toastId = toast.loading("Gerando novo link de acesso...");

        try {
            await api.post('/auth/resend-verification-from-token', { token });

            toast.success("Novo link enviado!", {
                id: toastId,
                description: "Verifique sua caixa de entrada e também a pasta de spam."
            });

            setMessage("Um novo link foi enviado para o seu e-mail corporativo.");
        } catch (error: any) {
            toast.error("Não foi possível reenviar o link automaticamente.", {
                id: toastId,
                description: "Por favor, tente fazer o login ou entre em contato com o suporte."
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                    {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                    {status === 'success' && (
                        <div className="relative">
                             <CheckCircle className="h-16 w-16 text-green-500" />
                             <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                                {countdown}
                             </div>
                        </div>
                    )}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {status === 'loading' ? 'Aguarde um momento...' :
                        status === 'success' ? 'Conta Verificada!' : 'Falha na Verificação'}
                </h1>

                <p className="text-slate-600 mb-8 leading-relaxed">
                    {message}
                    {status === 'success' && (
                        <span className="block mt-2 text-sm font-medium text-slate-400">
                            Redirecionando para o login em {countdown}s...
                        </span>
                    )}
                </p>

                <div className="space-y-3">
                    {status === 'success' && (
                        <Button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                            <Mail className="mr-2 h-4 w-4" /> Ir para o Login Agora
                        </Button>
                    )}

                    {status === 'error' && (
                        <>
                            <Button
                                onClick={handleResendFromPage}
                                disabled={isResending}
                                className="w-full bg-slate-900 hover:bg-slate-800 transition-colors"
                            >
                                {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                                Reenviar Link de Validação
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => navigate('/login')}
                                className="w-full text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Voltar para o Login
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Rodapé sutil */}
            <p className="mt-8 text-sm text-slate-400">
                &copy; {new Date().getFullYear()} LicitaDocs. Todos os direitos reservados.
            </p>
        </div>
    );
}
