import { ClientVaultOrchestrator } from '../../../features/ClientVault/ClientVaultOrchestrator';

/**
 * Página do Cofre Digital do Cliente.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de carregamento, filtragem e interface do cofre 
 * está isolada na feature 'ClientVault'.
 */
export function DocumentsPage() {
    return <ClientVaultOrchestrator />;
}