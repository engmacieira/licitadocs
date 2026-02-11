import api from './api';

export interface Company {
    id: string;
    name: string;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    is_active: boolean;
    created_at: string;
}

export interface CompanyCreate {
    name: string;
    cnpj: string;
}

export interface CompanyDocument {
    id: string;
    filename: string;
    created_at: string;
    status: string;
}

export const companyService = {
    // 1. Listar (GET)
    getAll: async () => {
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
        await api.delete(`/admin/companies/${id}`);
    },

    // 5. Alternar Status (PATCH)
    toggleStatus: async (id: string) => {
        const response = await api.patch(`/admin/companies/${id}/toggle-status`);
        return response.data;
    },

    // 6. Obter por ID (GET)
    getById: async (id: string) => {
        const response = await api.get<Company>(`/admin/companies/${id}`);
        return response.data;
    },

    // 7. Listar Documentos (GET)
    getDocuments: async (companyId: string) => {
        const response = await api.get<CompanyDocument[]>(`/admin/companies/${companyId}/documents`);
        return response.data;
    },

    // 8. Upload de Documento (POST)
    uploadDocument: async (companyId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        // Header 'Content-Type': 'multipart/form-data' é gerado automaticamente pelo navegador
        const response = await api.post(`/admin/companies/${companyId}/upload`, formData);
        return response.data;
    },

    // 9. Download (GET Blob)
    downloadDocument: async (companyId: string, docId: string, filename: string) => {
        const response = await api.get(`/admin/companies/${companyId}/documents/${docId}/download`, {
            responseType: 'blob' // Importante para arquivos binários
        });

        // Cria um link temporário para forçar o download no navegador
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); // Nome do arquivo
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // 10. Deletar Documento (DELETE)
    deleteDocument: async (companyId: string, docId: string) => {
        await api.delete(`/admin/companies/${companyId}/documents/${docId}`);
    }
};