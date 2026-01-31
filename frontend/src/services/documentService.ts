import api from './api';

export interface DocumentDTO {
    id: string;
    filename: string;
    created_at?: string;
    owner_id: string;
    status: string;
}

export const documentService = {
    getAll: async () => {
        const response = await api.get<DocumentDTO[]>('/documents/');
        return response.data;
    },

    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/documents/upload', formData);
        return response.data;
    }
};