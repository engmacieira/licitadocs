import { SettingsOrchestrator } from '../../../features/CatalogSettings/SettingsOrchestrator';

/**
 * Página do Painel Administrativo para Configurações do Catálogo.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de gestão de Categorias e Tipos de Documentos está 
 * isolada na feature 'CatalogSettings'.
 */
export function SettingsPage() {
    return <SettingsOrchestrator />;
}