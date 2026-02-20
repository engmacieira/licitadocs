import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    }
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signIn()', () => {
        it('deve formatar as credenciais como URLSearchParams e retornar o token (Caminho Feliz)', async () => {
            const mockAuthResponse = { access_token: 'fake-jwt', token_type: 'bearer' };
            (api.post as any).mockResolvedValueOnce({ data: mockAuthResponse });

            const result = await authService.signIn({ email: 'admin@teste.com', password: '123' });

            // 1. Verificamos se chamou a API 1 vez
            expect(api.post).toHaveBeenCalledTimes(1);

            // 2. Extraímos os argumentos que o seu serviço passou para o Axios (URL e Payload)
            const [url, payload] = (api.post as any).mock.calls[0];

            // 3. Validações precisas
            expect(url).toBe('/auth/token');
            expect(payload).toBeInstanceOf(URLSearchParams); // Garante o formato OAuth2
            expect(payload.get('username')).toBe('admin@teste.com'); // Garante a tradução de email para username
            expect(payload.get('password')).toBe('123');

            // 4. Verificamos se a resposta foi limpa
            expect(result).toEqual(mockAuthResponse);
        });

        it('deve propagar o erro se a API rejeitar o login (Caminho Triste)', async () => {
            const mockError = new Error('Credenciais inválidas');
            (api.post as any).mockRejectedValueOnce(mockError);

            // O serviço não tem try/catch, logo o erro tem de "subir"
            await expect(authService.signIn({ email: 'admin@teste.com', password: '123' }))
                .rejects.toThrow('Credenciais inválidas');
        });
    });

    describe('register()', () => {
        it('deve enviar o FormData corretamente com o cabeçalho multipart/form-data', async () => {
            (api.post as any).mockResolvedValueOnce({ data: null });

            // Criamos um FormData falso (simulando ficheiros e textos)
            const mockFormData = new FormData();
            mockFormData.append('cnpj', '12.345.678/0001-90');

            await authService.register(mockFormData);

            // Verificamos a rota, o payload exato, E as configurações de Header!
            expect(api.post).toHaveBeenCalledWith(
                '/auth/register',
                mockFormData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
        });

        it('deve propagar o erro se a API falhar no registro (ex: CNPJ duplicado)', async () => {
            const mockError = new Error('CNPJ já cadastrado');
            (api.post as any).mockRejectedValueOnce(mockError);

            const mockFormData = new FormData();
            await expect(authService.register(mockFormData)).rejects.toThrow('CNPJ já cadastrado');
        });
    });
});