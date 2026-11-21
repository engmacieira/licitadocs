import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, AlertCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import type { Company } from '../../types';
import { Button } from '../../components/ui/Button';
import { PaymentSuccess } from './components/PaymentSuccess';

type VerificationState = 'loading' | 'confirmed' | 'pending' | 'error';

/**
 * Orquestrador da página de retorno do checkout (/payment/success).
 * Lê os parâmetros de retorno da Infinite Pay e consulta a API para
 * confirmar se o pagamento e a assinatura foram ativados.
 */
export function PaymentSuccessOrchestrator() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentCompany, loading: authLoading, reloadContext } = useAuth();

    const companyData: Partial<Company> | null = currentCompany;
    const legalName = companyData?.razao_social || 'Sua Empresa';

    const orderNsu = searchParams.get('order_nsu');
    const transactionNsu = searchParams.get('transaction_nsu');
    const slug = searchParams.get('slug');
    const receiptUrl = searchParams.get('receipt_url');
    const queryStatus = searchParams.get('status');
    const mode = searchParams.get('mode');

    const [verificationState, setVerificationState] = useState<VerificationState>('loading');

    const verifyPaymentStatus = useCallback(async () => {
        if (!companyData?.id) {
            setVerificationState('error');
            return;
        }

        setVerificationState('loading');

        try {
            const response = await paymentService.getStatus(companyData.id);
            if (response.is_payment_active) {
                setVerificationState('confirmed');
                await reloadContext().catch(() => undefined);
                return;
            }

            setVerificationState('pending');
        } catch (error) {
            console.error(error);
            setVerificationState('error');
            toast.error('Erro ao verificar pagamento', {
                description: 'Não foi possível consultar o status da sua assinatura.',
            });
        }
    }, [companyData?.id, reloadContext]);

    useEffect(() => {
        if (authLoading) {
            return;
        }
        verifyPaymentStatus();
    }, [authLoading, verifyPaymentStatus]);

    if (verificationState === 'loading') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        Verificando pagamento...
                    </h2>
                    <p className="text-sm text-slate-600">
                        Estamos confirmando a ativação da sua assinatura junto ao servidor.
                    </p>
                    {orderNsu && (
                        <p className="mt-4 text-xs text-slate-400 font-mono">
                            Pedido: {orderNsu}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (verificationState === 'confirmed') {
        return (
            <PaymentSuccess
                legalName={legalName}
                receiptUrl={receiptUrl}
                onGoToDashboard={() => navigate('/dashboard')}
            />
        );
    }

    if (verificationState === 'pending') {
        return (
            <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-amber-200">
                    <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Pagamento em processamento
                    </h2>
                    <p className="text-slate-600 text-sm mb-6">
                        Recebemos seu retorno, mas a confirmação do pagamento ainda está sendo processada. Clique abaixo para verificar novamente em alguns segundos.
                    </p>

                    {(orderNsu || transactionNsu || slug || queryStatus || mode) && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 text-left text-xs text-slate-500 space-y-1">
                            {orderNsu && <p><span className="font-semibold">Pedido:</span> {orderNsu}</p>}
                            {transactionNsu && <p><span className="font-semibold">Transação:</span> {transactionNsu}</p>}
                            {mode && <p><span className="font-semibold">Modo:</span> {mode}</p>}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button onClick={verifyPaymentStatus} className="w-full" size="lg">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Verificar novamente
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/payment')}
                            className="w-full"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para Pagamento
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-red-50/40 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-red-100">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Não foi possível confirmar
                </h2>
                <p className="text-slate-600 text-sm mb-6">
                    Ocorreu um erro ao verificar o status do seu pagamento. Você pode tentar novamente ou retornar à página de pagamento.
                </p>

                <div className="space-y-3">
                    <Button onClick={verifyPaymentStatus} className="w-full" size="lg">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tentar novamente
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/payment')}
                        className="w-full"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Pagamento
                    </Button>
                </div>
            </div>
        </div>
    );
}
