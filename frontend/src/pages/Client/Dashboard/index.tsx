import { DashboardOrchestrator } from '../../../features/ClientDashboard/DashboardOrchestrator';

/**
 * Página Inicial do Cliente (Dashboard).
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de verificação de onboarding, cálculo de saúde fiscal
 * e exibição de atualizações está isolada na feature 'ClientDashboard'.
 */
export function Dashboard() {
    return <DashboardOrchestrator />;
}