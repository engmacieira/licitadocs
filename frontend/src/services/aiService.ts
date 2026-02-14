import api from './api';

export interface ChatResponse {
    response: string;
    // Futuro: Adicionar citations, sources, etc.
}

export const aiService = {
    sendMessage: async (message: string): Promise<ChatResponse> => {
        const { data } = await api.post<ChatResponse>('/ai/chat', { message });
        return data;
    }
};