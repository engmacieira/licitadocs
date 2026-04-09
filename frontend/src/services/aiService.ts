import api from './api';

/**
 * Estrutura da resposta retornada pela API do Consultor de IA.
 * @interface ChatResponse
 */
export interface ChatResponse {
    /** Texto da resposta gerada pela inteligência artificial. */
    response: string;
    // Futuro: Adicionar citations, sources, etc.
}

/**
 * Serviço responsável pela comunicação com os endpoints de Inteligência Artificial.
 */
export const aiService = {
    /**
     * Envia uma mensagem de texto do utilizador para o Consultor IA e retorna a resposta gerada.
     * @param {string} message - A pergunta ou contexto digitado pelo utilizador no chat.
     * @returns {Promise<ChatResponse>} Uma promise que resolve com o objeto contendo a resposta da IA.
     */
    sendMessage: async (message: string, company_id: string): Promise<ChatResponse> => {
        const { data } = await api.post<ChatResponse>('/ai/chat', { message, company_id });
        return data;
    }
};