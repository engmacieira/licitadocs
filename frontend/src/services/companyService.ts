import api from './api';

export interface Company {
    id: string;
    name: string;
    cnpj: string;
    is_active: boolean;
    created_at: string;
}

export interface CompanyCreate {
    name: string;
    cnpj: string;
}

export const companyService = {
    // 1. Listar (GET)
    getAll: async () => {
        // ⚠️ IMPORTANTE: URL completa e com barra final para evitar Redirect 307
        const response = await api.get<Company[]>('/admin/companies/');
        return response.data;
    },

    // 2. Criar (POST)
    create: async (data: CompanyCreate) => {
        const response = await api.post('/admin/companies/', data);
        return response.data;
    },

    // 3. Atualizar (PUT)
    update: async (id: string, data: Partial<CompanyCreate>) => {
        const response = await api.put(`/admin/companies/${id}`, data);
        return response.data;
    },

    // 4. Excluir (DELETE)
    delete: async (id: string) => {
        // Lembre-se: URL completa + ID
        await api.delete(`/admin/companies/${id}`);
    }
};