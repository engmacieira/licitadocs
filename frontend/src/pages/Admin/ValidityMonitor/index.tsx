import { MonitorOrchestrator } from '../../../features/ValidityMonitor/MonitorOrchestrator';

/**
 * Página do Monitor Global de Regularidade e Vencimentos.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de carregamento paralelo, filtros de pesquisa e controle
 * de abas (tabs) está isolada na feature 'ValidityMonitor'.
 */
export function ValidityMonitorPage() {
    return <MonitorOrchestrator />;
}