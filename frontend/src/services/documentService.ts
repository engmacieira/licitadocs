import api from './api';

export interface DocumentDTO {
    id: string;
    filename: string;
    created_at?: string;
    owner_id: string;
    status: string;
    expiration_date?: string;
}

export const documentService = {
    getAll: async () => {
        const response = await api.get<DocumentDTO[]>('/documents/');
        return response.data;
    },

    upload: async (file: File, expirationDate?: string, targetCompanyId?: string) => {
        const formData = new FormData();
        formData.append('file', file);

        if (expirationDate) {
            formData.append('expiration_date', expirationDate);
        }

        if (targetCompanyId) {
            formData.append('target_company_id', targetCompanyId);
        }

        // UX: A resposta aqui é usada pelo toast.promise no componente
        const response = await api.post('/documents/upload', formData);
        return response.data;
    },

    downloadDocument: async (docId: string, filename: string) => {
        const response = await api.get(`/documents/${docId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};