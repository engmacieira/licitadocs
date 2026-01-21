import api from './api';

export interface ChatResponse {
    response: string;
}

export const aiService = {
    sendMessage: async (message: string) => {
        // Envia a mensagem para o endpoint que já existe no backend
        // Nota: O backend espera um corpo { "message": "..." }
        const { data } = await api.post<ChatResponse>('/ai/chat', { message });
        return data;
    }
};