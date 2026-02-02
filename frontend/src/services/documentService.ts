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

        const response = await api.post('/documents/upload', formData);
        return response.data;
    }
};