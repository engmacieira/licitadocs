import { DocumentVaultOrchestrator } from '../../../features/DocumentVault/DocumentVaultOrchestrator';

/**
 * Página do Painel Administrativo para Gestão e Upload de Documentos.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de seleção de empresas, listagem do cofre e controle de 
 * modais está isolada na feature 'DocumentVault'.
 */
export function AdminUploadPage() {
    return <DocumentVaultOrchestrator />;
}