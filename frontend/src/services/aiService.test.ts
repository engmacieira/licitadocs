import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './aiService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('aiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendMessage', () => {
        // Criamos um ID fictício para usar nos testes
        const mockCompanyId = 'company-123';

        it('should call api.post with correct URL, message and company_id (Happy Path)', async () => {
            const mockResponse = {
                data: {
                    response: 'Hello, I am your AI assistant.',
                },
            };
            vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

            const message = 'Hello';

            // ✅ CORREÇÃO 1: Passando o company_id exigido
            const result = await aiService.sendMessage(message, mockCompanyId);

            // ✅ CORREÇÃO 2: A expectativa agora precisa incluir o company_id no payload
            expect(api.post).toHaveBeenCalledWith('/ai/chat', {
                message,
                company_id: mockCompanyId
            });
            expect(result).toEqual(mockResponse.data);
        });

        it('should throw an error when API fails (Error Handling)', async () => {
            const mockError = {
                response: {
                    status: 500,
                    data: { detail: 'Internal Server Error' },
                },
            };
            vi.mocked(api.post).mockRejectedValueOnce(mockError);

            // ✅ CORREÇÃO 3: Passando o company_id também no teste de erro
            await expect(aiService.sendMessage('Hello', mockCompanyId)).rejects.toEqual(mockError);
        });
    });
});
