import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import api from './api';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKING DO TOAST E DA TELA (WINDOW)
// ==========================================
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn(),
    },
}));

// O JSDOM bloqueia alterações diretas no window.location,
// então nós "hackeamos" o objeto para conseguirmos testar o redirecionamento!
const originalLocation = window.location;

beforeAll(() => {
    Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost/' },
        writable: true,
    });
});

afterAll(() => {
    Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
    });
});

describe('Axios Interceptors (api.ts)', () => {
    // 🕵️ Extraímos as funções que você escreveu dentro dos interceptors do Axios!
    const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const responseSuccess = (api.interceptors.response as any).handlers[0].fulfilled;
    const responseError = (api.interceptors.response as any).handlers[0].rejected;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.location.href = 'http://localhost/';
    });

    describe('Request Interceptor', () => {
        it('deve injetar o token JWT no cabeçalho Authorization se ele existir', async () => {
            localStorage.setItem('@LicitaDoc:token', 'meu-token-secreto');
            const config = { headers: {} }; // Configuração vazia falsa

            const result = await requestInterceptor(config);

            expect(result.headers.Authorization).toBe('Bearer meu-token-secreto');
        });

        it('não deve alterar os cabeçalhos se o token não existir', async () => {
            const config = { headers: {} };

            const result = await requestInterceptor(config);

            expect(result.headers.Authorization).toBeUndefined();
        });
    });

    describe('Response Interceptor', () => {
        it('deve deixar a resposta passar intacta se for sucesso (Caminho Feliz)', () => {
            const mockResponse = { data: 'Sucesso', status: 200 };
            const result = responseSuccess(mockResponse);
            expect(result).toBe(mockResponse);
        });

        it('deve exibir toast de erro de conexão se a API não retornar uma resposta (Internet caiu)', async () => {
            const networkError = new Error('Network Error');
            // O Axios não coloca "response" no objeto de erro quando a internet cai

            await expect(responseError(networkError)).rejects.toThrow('Network Error');

            expect(toast.error).toHaveBeenCalledWith(
                "Sem conexão com o servidor",
                expect.objectContaining({ description: expect.any(String) })
            );
        });

        it('deve exibir toast de Acesso Negado em erros 403', async () => {
            const error403 = { response: { status: 403 } };

            await expect(responseError(error403)).rejects.toEqual(error403);

            expect(toast.error).toHaveBeenCalledWith(
                "Acesso Negado",
                expect.objectContaining({ description: expect.any(String) })
            );
        });

        it('deve exibir toast de Erro Interno em erros 500 ou superiores', async () => {
            const error500 = { response: { status: 502 } }; // Testando com 502 Bad Gateway

            await expect(responseError(error500)).rejects.toEqual(error500);

            expect(toast.error).toHaveBeenCalledWith(
                "Erro interno do servidor",
                expect.objectContaining({ description: expect.any(String) })
            );
        });

        it('deve limpar sessão, avisar e redirecionar para o login em erros 401', async () => {
            // 🕰️ Ativamos a máquina do tempo do Vitest para não termos de esperar 1.5s no teste
            vi.useFakeTimers();

            localStorage.setItem('@LicitaDoc:token', 'token-vencido');
            localStorage.setItem('@LicitaDoc:companyId', '123');
            const error401 = { response: { status: 401 } };

            // Executa o interceptor e garante que ele rejeitou a promessa
            const rejectionPromise = responseError(error401);
            await expect(rejectionPromise).rejects.toEqual(error401);

            // Verifica as limpezas síncronas
            expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
            expect(localStorage.getItem('@LicitaDoc:companyId')).toBeNull();
            expect(toast.warning).toHaveBeenCalledWith(
                "Sessão expirada",
                expect.any(Object)
            );

            // O redirecionamento ainda não aconteceu, pois está no setTimeout!
            expect(window.location.href).toBe('http://localhost/');

            // ⏩ Avançamos o tempo em 1.5 segundos
            vi.runAllTimers();

            // Agora sim, a página mudou!
            expect(window.location.href).toBe('/login');

            // 🕰️ Desligamos a máquina do tempo
            vi.useRealTimers();
        });
    });
});