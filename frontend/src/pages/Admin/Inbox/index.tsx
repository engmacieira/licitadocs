import { InboxOrchestrator } from '../../../features/AdminInbox/InboxOrchestrator';

/**
 * Página do Painel Administrativo para a Central de Mensagens e Avisos.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de chat de suporte, comunicados em massa e gestão de tickets
 * está isolada na feature 'AdminInbox'.
 */
export function AdminInboxPage() {
    return <InboxOrchestrator />;
}