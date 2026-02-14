import api from './api';
import type { Company } from './companyService';
import type { DocumentDTO } from './documentService';

export interface AdminStats {
    total_companies: number;
    total_documents: number;
    total_users: number;
    recent_documents: DocumentDTO[];
    recent_companies: Company[];
}

export interface ClientStats {
    company_name: string;
    total_docs: number;
    docs_valid: number;
    docs_expired: number;
    recent_docs: DocumentDTO[];
    is_contract_signed: boolean;
    is_payment_active: boolean;
    is_admin_verified: boolean;
}

export const dashboardService = {
    getAdminStats: async (): Promise<AdminStats> => {
        const { data } = await api.get<AdminStats>('/dashboard/admin/stats');
        return data;
    },

    getClientStats: async (companyId?: string): Promise<ClientStats> => {
        const url = companyId
            ? `/dashboard/client/stats?company_id=${companyId}`
            : '/dashboard/client/stats';

        const { data } = await api.get<ClientStats>(url);
        return data;
    }
};