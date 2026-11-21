import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import type { Company } from '../../types';

import { OrderSummary } from './components/OrderSummary';
import { InfinitePayCheckoutForm } from './components/InfinitePayCheckoutForm';

interface PaymentLocationState {
    legalName?: string;
    responsibleName?: string;
    email?: string;
}

/**
 * Orquestrador do fluxo de Pagamento via Infinite Pay.
 * Cria a sessão de checkout no backend e redireciona para o link externo
 * da Infinite Pay ou para a rota interna de retorno em modo sandbox.
 */
export function PaymentOrchestrator() {
    const navigate = useNavigate();
    const location = useLocation();

    const { currentCompany } = useAuth();
    const companyData: Partial<Company> | null = currentCompany;
    const locationState = (location.state as PaymentLocationState | null) ?? null;

    // Prioridade: Dados do Contexto > Dados da Navegação > Fallback
    const legalName = companyData?.razao_social || locationState?.legalName || 'Sua Empresa';
    const responsibleName = companyData?.responsavel_nome || locationState?.responsibleName || 'Responsável Legal';

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!currentCompany && !locationState?.email) {
            // Sessão pode ainda estar sendo resolvida pelo AuthContext
        }
    }, [currentCompany, locationState]);

    /**
     * Inicia o checkout no backend e redireciona para o gateway ou rota sandbox.
     */
    const handlePayment = async () => {
        if (!companyData?.id) {
            toast.error('Sessão expirada', {
                description: 'Por favor, faça login novamente para continuar.',
            });
            return;
        }

        setIsProcessing(true);

        try {
            const response = await paymentService.createCheckout({
                company_id: companyData.id,
                plan: 'PRO',
                billing_cycle: 'annual',
            });

            const checkoutUrl = response.checkout_url;
            if (checkoutUrl.startsWith('http://') || checkoutUrl.startsWith('https://')) {
                window.location.assign(checkoutUrl);
                return;
            }

            const sandboxUrl =
                checkoutUrl ||
                `/payment/success?order_nsu=${encodeURIComponent(response.order_nsu)}&mode=${encodeURIComponent(response.mode || 'sandbox')}`;
            navigate(sandboxUrl);
        } catch (error) {
            console.error(error);
            toast.error('Falha ao iniciar pagamento', {
                description: 'Não foi possível gerar o link de pagamento. Tente novamente.',
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
                <OrderSummary />
                <InfinitePayCheckoutForm
                    legalName={legalName}
                    responsibleName={responsibleName}
                    isProcessing={isProcessing}
                    onPayment={handlePayment}
                />
            </div>
        </div>
    );
}
