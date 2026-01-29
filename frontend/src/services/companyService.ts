import api from './api';

export interface Company {
    id: string;
    name: string; // O backend manda 'name' (mapeado de razao_social)
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
        const response = await api.get<Company[]>('http://127.0.0.1:8000/admin/companies/');
        return response.data;
    },

    // 2. Criar (POST)
    create: async (data: CompanyCreate) => {
        const response = await api.post('http://127.0.0.1:8000/admin/companies/', data);
        return response.data;
    },

    // 3. Atualizar (PUT)
    update: async (id: string, data: Partial<CompanyCreate>) => {
        const response = await api.put(`http://127.0.0.1:8000/admin/companies/${id}`, data);
        return response.data;
    },

    // 4. Excluir (DELETE)
    delete: async (id: string) => {
        // Lembre-se: URL completa + ID
        await api.delete(`http://127.0.0.1:8000/admin/companies/${id}`);
    }
};