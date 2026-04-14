import api from './api';
import type { DashboardAdminStats, ClientStats } from '../types';

/**
 * Serviço responsável por buscar dados agregados e métricas para os Dashboards.
 * Isola as consultas complexas de contagem e status em métodos simples de consumo.
 */
export const dashboardService = {
    /**
     * Recupera as estatísticas globais do sistema para a visão do Administrador.
     * @returns {Promise<DashboardAdminStats>} Promessa contendo totais e listas recentes.
     */
    getAdminStats: async (): Promise<DashboardAdminStats> => {
        const { data } = await api.get<DashboardAdminStats>('/dashboard/admin/stats');
        return data;
    },

    /**
     * Recupera as estatísticas e status de regularidade de uma empresa específica.
     * Caso o Admin esteja visualizando, ele pode passar o ID da empresa alvo.
     * @param {string} [companyId] - (Opcional) ID da empresa para consulta específica via Admin.
     * @returns {Promise<ClientStats>} Promessa contendo os KPIs de saúde fiscal do cliente.
     */
    getClientStats: async (companyId?: string): Promise<ClientStats> => {
        const url = companyId
            ? `/dashboard/client/stats?company_id=${companyId}`
            : '/dashboard/client/stats';

        const { data } = await api.get<ClientStats>(url);
        return data;
    }
};