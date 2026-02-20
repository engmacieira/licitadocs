import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    }
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMyCompanies()', () => {
        it('deve buscar a lista de empresas vinculadas ao usuário logado', async () => {
            // Fábrica de Dados: Mock de empresas
            const mockCompanies = [
                {
                    id: 'c1',
                    razao_social: 'Empresa A',
                    cnpj: '12.345.678/0001-90',
                    role: 'MASTER' as const,
                    status: true,
                    created_at: '2024-01-01'
                }
            ];

            (api.get as any).mockResolvedValueOnce({ data: mockCompanies });

            const result = await userService.getMyCompanies();

            // Valida se chamou o endpoint correto de "meu contexto"
            expect(api.get).toHaveBeenCalledWith('/users/me/companies');
            expect(result).toEqual(mockCompanies);
        });

        it('deve propagar o erro se falhar ao buscar empresas', async () => {
            (api.get as any).mockRejectedValueOnce(new Error('Erro de permissão'));

            await expect(userService.getMyCompanies()).rejects.toThrow('Erro de permissão');
        });
    });

    describe('getMe()', () => {
        it('deve buscar os dados do perfil do usuário atual', async () => {
            // Fábrica de Dados: Mock do perfil
            const mockProfile = {
                id: 'user-123',
                email: 'utilizador@teste.com',
                is_active: true,
                role: 'client'
            };

            (api.get as any).mockResolvedValueOnce({ data: mockProfile });

            const result = await userService.getMe();

            // Valida se chamou o endpoint de perfil
            expect(api.get).toHaveBeenCalledWith('/users/me');
            expect(result).toEqual(mockProfile);
        });

        it('deve propagar o erro se o perfil não puder ser carregado (ex: Token inválido)', async () => {
            (api.get as any).mockRejectedValueOnce(new Error('Unauthorized'));

            await expect(userService.getMe()).rejects.toThrow('Unauthorized');
        });
    });
});