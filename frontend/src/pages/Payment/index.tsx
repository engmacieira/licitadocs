import { PaymentOrchestrator } from '../../features/Payment/PaymentOrchestrator';

/**
 * Página de Pagamento e Ativação de Conta (Fim do Onboarding).
 * Funciona apenas como um ponto de roteamento.
 * Toda a inteligência de simulação de gateway, chamadas à API e 
 * transições de ecrã reside no módulo 'Payment'.
 */
export function PaymentPage() {
    return <PaymentOrchestrator />;
}