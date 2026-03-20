import { CompanySettingsOrchestrator } from '../../../features/CompanySettings/CompanySettingsOrchestrator';

/**
 * Página de Configurações do Cliente.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de gestão da empresa, documentação, equipa e perfil
 * está isolada na feature 'CompanySettings'.
 */
export function CompanySettingsPage() {
    return <CompanySettingsOrchestrator />;
}