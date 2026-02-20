import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './aiService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    }
}));

describe('aiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendMessage()', () => {
        it('deve enviar a mensagem e retornar a resposta da IA com sucesso (Caminho Feliz)', async () => {
            // 1. Preparamos a resposta falsa do Backend (Axios devolve tudo dentro de um objeto "data")
            const mockResponse = { response: 'A licitação é um processo administrativo...' };
            (api.post as any).mockResolvedValueOnce({ data: mockResponse });

            // 2. Chamamos o serviço
            const result = await aiService.sendMessage('O que é licitação?');

            // 3. Verificamos se ele formatou a chamada corretamente
            expect(api.post).toHaveBeenCalledWith('/ai/chat', { message: 'O que é licitação?' });

            // 4. Verificamos se ele desempacotou o `data` e retornou apenas a resposta
            expect(result).toEqual(mockResponse);
        });

        it('deve repassar o erro para o componente se a API falhar (Caminho Triste)', async () => {
            // 1. Simulamos um erro de rede ou 500 do servidor
            const mockError = new Error('Gemini API Offline');
            (api.post as any).mockRejectedValueOnce(mockError);

            // 2 e 3. Como o aiService não tem try/catch, nós esperamos que a Promise seja rejeitada (.rejects)
            await expect(aiService.sendMessage('Tem alguém aí?')).rejects.toThrow('Gemini API Offline');

            expect(api.post).toHaveBeenCalledTimes(1);
        });
    });
});