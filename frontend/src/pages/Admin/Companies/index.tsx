import { CompaniesOrchestrator } from '../../../features/CompanyManagement/CompaniesOrchestrator';

/**
 * Página do Painel Administrativo para Gestão da Carteira de Clientes.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de carregamento de empresas, filtragem e renderização
 * da tabela está isolada na feature 'CompanyManagement'.
 */
export function AdminCompaniesPage() {
    return <CompaniesOrchestrator />;
}