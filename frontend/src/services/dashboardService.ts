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
    cnpj: string;
    is_active: boolean;
    total_documents: number;
    recent_documents: DocumentDTO[];
}

export const dashboardService = {
    getAdminStats: async () => {
        const response = await api.get<AdminStats>('/dashboard/admin/stats');
        return response.data;
    },

    getClientStats: async () => {
        const response = await api.get<ClientStats>('/dashboard/client/stats');
        return response.data;
    }
};