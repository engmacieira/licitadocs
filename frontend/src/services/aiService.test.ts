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
        it('should call api.post with correct URL and message (Happy Path)', async () => {
            const mockResponse = {
                data: {
                    response: 'Hello, I am your AI assistant.',
                },
            };
            vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

            const message = 'Hello';
            const result = await aiService.sendMessage(message);

            expect(api.post).toHaveBeenCalledWith('/ai/chat', { message });
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

            await expect(aiService.sendMessage('Hello')).rejects.toEqual(mockError);
        });
    });
});
