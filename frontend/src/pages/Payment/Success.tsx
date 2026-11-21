import { PaymentSuccessOrchestrator } from '../../features/Payment/PaymentSuccessOrchestrator';

/**
 * Página de retorno e confirmação de pagamento (Infinite Pay / Sandbox).
 * Funciona apenas como ponto de roteamento para o PaymentSuccessOrchestrator.
 */
export function PaymentSuccessPage() {
    return <PaymentSuccessOrchestrator />;
}
