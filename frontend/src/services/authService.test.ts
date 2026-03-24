import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import api from './api';

// Mock the api instance
vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signIn', () => {
        it('should call api.post with correct URL and search parameters (Happy Path)', async () => {
            const mockResponse = {
                data: {
                    access_token: 'valid-token',
                    token_type: 'bearer',
                },
            };
            vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

            const credentials = {
                email: 'test@example.com',
                password: 'password123',
            };

            const result = await authService.signIn(credentials);

            expect(api.post).toHaveBeenCalledWith('/auth/token', expect.any(URLSearchParams));
            
            // Check if URLSearchParams contains the correct data
            const callArgs = vi.mocked(api.post).mock.calls[0];
            const formData = callArgs[1] as URLSearchParams;
            expect(formData.get('username')).toBe(credentials.email);
            expect(formData.get('password')).toBe(credentials.password);
            
            expect(result).toEqual(mockResponse.data);
        });

        it('should throw an error when sign-in fails (Error Handling)', async () => {
            const mockError = {
                response: {
                    status: 401,
                    data: { detail: 'Invalid credentials' },
                },
            };
            vi.mocked(api.post).mockRejectedValueOnce(mockError);

            const credentials = {
                email: 'wrong@example.com',
                password: 'wrongpassword',
            };

            await expect(authService.signIn(credentials)).rejects.toEqual(mockError);
        });
    });

    describe('register', () => {
        it('should call api.post with FormData and correct headers (Happy Path)', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

            const mockFormData = new FormData();
            mockFormData.append('name', 'Test Company');

            await authService.register(mockFormData);

            expect(api.post).toHaveBeenCalledWith('/auth/register', mockFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        });

        it('should throw an error when registration fails (Error Handling)', async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: { detail: 'Company already exists' },
                },
            };
            vi.mocked(api.post).mockRejectedValueOnce(mockError);

            const mockFormData = new FormData();

            await expect(authService.register(mockFormData)).rejects.toEqual(mockError);
        });
    });
});
