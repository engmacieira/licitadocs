import api from './api';

export interface ChatResponse {
    response: string;
    // Adicionar outros campos se o backend retornar (ex: sources, citations)
}

export const aiService = {
    sendMessage: async (message: string) => {
        const { data } = await api.post<ChatResponse>('/ai/chat', { message });
        return data;
    }
};