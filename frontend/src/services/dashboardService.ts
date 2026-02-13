import api from './api';
import type { Company } from './companyService';
// Assumindo que DocumentDTO é compatível, senão podemos usar um tipo local
import type { DocumentDTO } from './documentService';

export interface AdminStats {
    total_companies: number;
    total_documents: number;
    total_users: number;
    recent_documents: DocumentDTO[];
    recent_companies: Company[];
}

// [CORREÇÃO] Interface alinhada com o retorno do novo dashboard_router.py
export interface ClientStats {
    company_name: string;
    total_docs: number;
    docs_valid: number;
    docs_expired: number;
    recent_docs: DocumentDTO[];
}

export const dashboardService = {
    getAdminStats: async () => {
        const response = await api.get<AdminStats>('/dashboard/admin/stats');
        return response.data;
    },

    // [CORREÇÃO] Aceita companyId opcional para filtrar por empresa
    getClientStats: async (companyId?: string) => {
        // Se vier ID, monta a query string ?company_id=...
        const url = companyId
            ? `/dashboard/client/stats?company_id=${companyId}`
            : '/dashboard/client/stats';

        const response = await api.get<ClientStats>(url);
        return response.data;
    }
};