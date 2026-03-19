import api from './api';

export interface EmissionRuleDTO {
    id: string;
    document_type_id: string;
    document_type_name?: string;
    state?: string;
    city?: string;
    emission_link?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    operation_notes?: string;
    created_at: string;
}

export type EmissionRuleCreatePayload = Omit<EmissionRuleDTO, 'id' | 'created_at' | 'document_type_name'>;
export type EmissionRuleUpdatePayload = Partial<EmissionRuleCreatePayload>;

export const emissionRuleService = {
    getAll: async (): Promise<EmissionRuleDTO[]> => {
        const { data } = await api.get<EmissionRuleDTO[]>('/emission-rules/');
        return data;
    },
    create: async (payload: EmissionRuleCreatePayload): Promise<EmissionRuleDTO> => {
        const { data } = await api.post<EmissionRuleDTO>('/emission-rules/', payload);
        return data;
    },
    update: async (id: string, payload: EmissionRuleUpdatePayload): Promise<EmissionRuleDTO> => {
        const { data } = await api.put<EmissionRuleDTO>(`/emission-rules/${id}`, payload);
        return data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/emission-rules/${id}`);
    },
    resolveLink: async (documentTypeId: string, companyId: string): Promise<EmissionRuleDTO | null> => {
        try {
            const { data } = await api.get<EmissionRuleDTO>(`/emission-rules/resolve`, {
                params: { document_type_id: documentTypeId, company_id: companyId }
            });
            return data;
        } catch {
            return null; // Retorna null se não houver regra (404/Erro)
        }
    },
    getById: async (id: string): Promise<EmissionRuleDTO> => {
        const { data } = await api.get<EmissionRuleDTO>(`/emission-rules/${id}`);
        return data;
    }
};