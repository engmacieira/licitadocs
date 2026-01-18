import api from './api';

export interface DocumentDTO {
    id: string;
    filename: string;
    created_at?: string; // O backend pode ou não retornar isso agora
    owner_id: string;
}

export const documentService = {
    // Busca todos os documentos do usuário logado
    getAll: async () => {
        const response = await api.get<DocumentDTO[]>('/documents');
        return response.data;
    },

    // (Preparo para o futuro) Upload
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};