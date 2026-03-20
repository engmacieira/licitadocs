import { SignatureOrchestrator } from '../../../features/DigitalSignature/SignatureOrchestrator';

/**
 * Página de Assinatura Digital (Onboarding do Cliente).
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de extração de dados, geração de PDF, e upload 
 * está isolada na feature 'DigitalSignature'.
 */
export function SignaturePage() {
    return <SignatureOrchestrator />;
}