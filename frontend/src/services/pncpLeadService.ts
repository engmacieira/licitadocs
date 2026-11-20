import api from './api';
import type {
    PncpLeadContactRequest,
    PncpLeadContactResponse,
    PncpLeadListParams,
    PncpLeadListResponse,
    PncpLeadResponse,
    PncpLeadSyncRequest,
    PncpLeadSyncResponse,
} from '../types';

/**
 * Serviço responsável pelas chamadas à API administrativa de Leads PNCP.
 * Gerencia listagem, sincronização com o PNCP, detalhamento e registro de contatos anti-SPAM.
 */
export const pncpLeadService = {
    /**
     * Lista leads extraídos do PNCP com filtros opcionais e estatísticas anti-SPAM.
     */
    listLeads: async (params: PncpLeadListParams = {}): Promise<PncpLeadListResponse> => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
        );

        const response = await api.get<PncpLeadListResponse>('/admin/leads', {
            params: cleanParams,
        });
        return response.data;
    },

    /**
     * Dispara sincronização/extração de fornecedores na API pública do PNCP.
     */
    syncLeads: async (payload: PncpLeadSyncRequest = {}): Promise<PncpLeadSyncResponse> => {
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')
        );

        const response = await api.post<PncpLeadSyncResponse>('/admin/leads/sync', cleanPayload);
        return response.data;
    },

    /**
     * Registra um novo contato comercial com o lead e retorna status atualizado + alerta anti-SPAM.
     */
    registerContact: async (
        leadId: string,
        payload: PncpLeadContactRequest
    ): Promise<PncpLeadContactResponse> => {
        const response = await api.post<PncpLeadContactResponse>(
            `/admin/leads/${leadId}/contact`,
            payload
        );
        return response.data;
    },

    /**
     * Busca os detalhes completos de um lead específico pelo ID.
     */
    getLeadById: async (leadId: string): Promise<PncpLeadResponse> => {
        const response = await api.get<PncpLeadResponse>(`/admin/leads/${leadId}`);
        return response.data;
    },
};
