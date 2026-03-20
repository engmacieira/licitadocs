import { DashboardOrchestrator } from '../../../features/AdminDashboard/DashboardOrchestrator';

/**
 * Página inicial do Painel Administrativo (Dashboard).
 * Funciona apenas como um ponto de roteamento.
 * Toda a lógica de carregamento de KPIs, agrupamento de pendências e 
 * painéis visuais reside no módulo 'AdminDashboard'.
 */
export function AdminDashboardPage() {
    return <DashboardOrchestrator />;
}