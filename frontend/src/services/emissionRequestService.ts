import api from './api';

/**
 * Interface que representa um item no histórico de solicitações de emissão.
 * @interface RequestHistoryItem
 */
export interface RequestHistoryItem {
    /** Identificador único do registo de solicitação. */
    id: string;
    /** Data e hora em que o requerimento foi disparado. */
    date: Date;
    /** ID da empresa solicitante. */
    companyId: string;
    /** Nome/Razão Social da empresa solicitante. */
    companyName: string;
    /** Data de previsão de retorno informada pelo órgão (formato YYYY-MM-DD). */
    estimatedDate: string;
    /** Status atual da solicitação (pending | completed). */
    status: 'pending' | 'completed';
}

/**
 * Serviço responsável pela gestão das solicitações de emissão manual.
 * Controla o histórico de disparos de e-mail, registo de protocolos e
 * acompanhamento de prazos de retorno das prefeituras/órgãos.
 */
export const emissionRequestService = {
    /**
     * Recupera o histórico de solicitações vinculado a uma regra de emissão e uma empresa.
     * Realiza a conversão automática das strings de data do backend para objetos Date.
     * @param {string} ruleId - ID da regra de emissão (Município/Estado).
     * @param {string} companyId - ID da empresa selecionada.
     * @returns {Promise<RequestHistoryItem[]>} Lista de interações formatada para a UI.
     */
    getByRuleAndCompany: async (ruleId: string, companyId: string): Promise<RequestHistoryItem[]> => {
        const { data } = await api.get(`/emission-rules/${ruleId}/requests`, {
            params: { company_id: companyId }
        });

        return data.map((item: any) => ({
            ...item,
            date: new Date(item.date)
        }));
    },

    /**
     * Regista um novo disparo de e-mail ou requerimento no histórico.
     * @param {string} ruleId - ID da regra de emissão vinculada.
     * @param {string} companyId - ID da empresa para a qual o documento é solicitado.
     * @returns {Promise<RequestHistoryItem>} O novo registo criado.
     */
    create: async (ruleId: string, companyId: string): Promise<RequestHistoryItem> => {
        const { data } = await api.post(`/emission-rules/${ruleId}/requests`, {
            company_id: companyId
        });

        return {
            ...data,
            date: new Date(data.date)
        };
    },

    /**
     * Atualiza o status de conclusão ou a data de previsão de uma solicitação existente.
     * @param {string} requestId - ID do registo de solicitação a atualizar.
     * @param {Object} payload - Objeto contendo o novo status ou a nova data estimada.
     * @returns {Promise<void>}
     */
    update: async (requestId: string, payload: { status?: string; estimated_date?: string }): Promise<void> => {
        await api.patch(`/emission-rules/requests/${requestId}`, payload);
    }
};