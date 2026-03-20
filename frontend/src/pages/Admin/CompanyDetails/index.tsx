import { CompanyDetailsOrchestrator } from '../../../features/CompanyDetails/CompanyDetailsOrchestrator';

/**
 * Página do Painel Administrativo para Detalhes de uma Empresa específica.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de carregamento dos dados, aprovação de compliance e
 * visualização está isolada na feature 'CompanyDetails'.
 */
export function AdminCompanyDetailsPage() {
    return <CompanyDetailsOrchestrator />;
}