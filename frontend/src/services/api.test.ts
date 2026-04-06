import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';

// Hoist variables to be accessible within vi.mock
const mocks = vi.hoisted(() => ({
    requestInterceptor: null as any,
    responseSuccessInterceptor: null as any,
    responseErrorInterceptor: null as any,
}));

vi.mock('axios', () => {
    const mockAxiosInstance = {
        interceptors: {
            request: {
                use: vi.fn((fn) => { mocks.requestInterceptor = fn; })
            },
            response: {
                use: vi.fn((success, error) => {
                    mocks.responseSuccessInterceptor = success;
                    mocks.responseErrorInterceptor = error;
                })
            }
        },
        create: vi.fn().mockReturnThis(),
        defaults: { headers: { common: {} } },
    };
    return {
        default: {
            create: vi.fn(() => mockAxiosInstance),
        }
    }
});

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn(),
    }
}));

// Importamos o api APÓS o mock do axios ser definido para que a instância use o mock
import api from './api';

describe('api service (interceptors)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        localStorage.clear();

        // Mock do window.location
        vi.stubGlobal('location', { href: '' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('Request Interceptor', () => {
        it('should add Authorization header if token exists in localStorage', () => {
            localStorage.setItem('@LicitaDoc:token', 'test-token');
            const config = { headers: {} } as any;

            const result = mocks.requestInterceptor(config);

            expect(result.headers.Authorization).toBe('Bearer test-token');
        });

        it('should NOT add Authorization header if token does not exist', () => {
            const config = { headers: {} } as any;

            const result = mocks.requestInterceptor(config);

            expect(result.headers.Authorization).toBeUndefined();
        });
    });

    describe('Response Interceptor', () => {
        it('should return response on success', () => {
            const response = { data: 'test' };
            const result = mocks.responseSuccessInterceptor(response);
            expect(result).toBe(response);
        });

        it('should show toast.error on network error (no response)', async () => {
            const error = { request: {} }; // Representa erro de rede sem resposta do servidor

            await expect(mocks.responseErrorInterceptor(error)).rejects.toBe(error);

            expect(toast.error).toHaveBeenCalledWith('Sem conexão com o servidor', expect.objectContaining({
                description: expect.any(String)
            }));
        });

        it('should handle 401: clear storage, show toast, and redirect', async () => {
            localStorage.setItem('@LicitaDoc:token', 'old-token');
            localStorage.setItem('@LicitaDoc:companyId', 'old-id');
            const error = {
                response: { status: 401 }
            };

            await expect(mocks.responseErrorInterceptor(error)).rejects.toBe(error);

            expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
            expect(localStorage.getItem('@LicitaDoc:companyId')).toBeNull();
            expect(toast.warning).toHaveBeenCalledWith('Sessão expirada', expect.any(Object));

            // Verifica o redirecionamento após o timeout
            vi.advanceTimersByTime(1500);
            expect(window.location.href).toBe('/login');
        });

        it('should show toast.error on 403 Forbidden', async () => {
            const error = {
                response: { status: 403 }
            };

            await expect(mocks.responseErrorInterceptor(error)).rejects.toBe(error);

            expect(toast.error).toHaveBeenCalledWith('Acesso Negado', expect.any(Object));
        });

        it('should show toast.error on 500+ Server Error', async () => {
            const error = {
                response: { status: 500 }
            };

            await expect(mocks.responseErrorInterceptor(error)).rejects.toBe(error);

            expect(toast.error).toHaveBeenCalledWith('Erro interno do servidor', expect.any(Object));
        });

        it('should NOT show any toast on unhandled status codes (e.g. 404)', async () => {
            const error = {
                response: { status: 404 }
            };

            await expect(mocks.responseErrorInterceptor(error)).rejects.toBe(error);

            expect(toast.error).not.toHaveBeenCalled();
            expect(toast.warning).not.toHaveBeenCalled();
        });
    });
});
