import api from './api';

export interface DocumentDTO {
    id: string;
    filename: string;
    created_at?: string;
    owner_id: string;
}

export const documentService = {
    getAll: async () => {
        // Tem que ser HTTP://127.0.0.1:8000... e ter a BARRA / no final
        const response = await api.get<DocumentDTO[]>('http://127.0.0.1:8000/documents/');
        console.log("🔥 BUSCA NO BACKEND:", response.status, response.data);
        return response.data;
    },

    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('http://127.0.0.1:8000/documents/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
};