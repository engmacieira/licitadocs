import api from './api';

import type { RequestHistoryItem } from '../pages/Admin/ManualEmission/components/HistorySection';

export const emissionRequestService = {
    // Busca o histórico de uma regra filtrando pela empresa selecionada
    getByRuleAndCompany: async (ruleId: string, companyId: string): Promise<RequestHistoryItem[]> => {
        // No FastAPI, company_id vai automaticamente como Query Parameter (?company_id=...)
        const { data } = await api.get(`/emission-rules/${ruleId}/requests`, {
            params: { company_id: companyId }
        });

        // Converte a data string do backend para o objeto Date que o nosso componente espera
        return data.map((item: any) => ({
            ...item,
            date: new Date(item.date)
        }));
    },

    // Grava um novo disparo de e-mail
    create: async (ruleId: string, companyId: string): Promise<RequestHistoryItem> => {
        const { data } = await api.post(`/emission-rules/${ruleId}/requests`, { company_id: companyId });
        return {
            ...data,
            date: new Date(data.date)
        };
    },

    // Atualiza o status ou a data de previsão
    update: async (requestId: string, payload: { status?: string; estimated_date?: string }): Promise<void> => {
        await api.patch(`/emission-rules/requests/${requestId}`, payload);
    }
};