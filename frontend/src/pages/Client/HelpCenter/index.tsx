import { HelpCenterOrchestrator } from '../../../features/HelpCenter/HelpCenterOrchestrator';

/**
 * Página da Central de Ajuda e Suporte do Cliente.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de chat, leitura de avisos e criação de tickets
 * está isolada na feature 'HelpCenter'.
 */
export function HelpCenterPage() {
    return <HelpCenterOrchestrator />;
}