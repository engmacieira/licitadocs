import { TermsAcceptanceOrchestrator } from '../../features/Onboarding/TermsAcceptanceOrchestrator';

/**
 * Página de Assinatura e Aceite de Termos (Passo final do Onboarding).
 * Funciona apenas como um ponto de roteamento.
 * Toda a inteligência de validação de leitura (scroll), modais de minutas
 * e comunicação com a API reside no módulo 'Onboarding'.
 */
export function ContractSignPage() {
    return <TermsAcceptanceOrchestrator />;
}