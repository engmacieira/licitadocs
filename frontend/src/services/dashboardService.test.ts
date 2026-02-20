import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from './dashboardService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    }
}));

describe('dashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAdminStats()', () => {
        it('deve buscar as estatísticas gerais do administrador com sucesso', async () => {
            // Fábrica de Dados: Mock da resposta do Admin
            const mockAdminStats = {
                total_companies: 10,
                total_documents: 50,
                total_users: 15,
                recent_documents: [],
                recent_companies: []
            };

            (api.get as any).mockResolvedValueOnce({ data: mockAdminStats });

            const result = await dashboardService.getAdminStats();

            // Valida se chamou a rota certa e devolveu os dados limpos
            expect(api.get).toHaveBeenCalledWith('/dashboard/admin/stats');
            expect(result).toEqual(mockAdminStats);
        });

        it('deve propagar o erro se a API falhar', async () => {
            const mockError = new Error('Erro ao carregar dashboard admin');
            (api.get as any).mockRejectedValueOnce(mockError);

            await expect(dashboardService.getAdminStats()).rejects.toThrow('Erro ao carregar dashboard admin');
        });
    });

    describe('getClientStats()', () => {
        // Fábrica de Dados: Mock da resposta do Cliente
        const mockClientStats = {
            company_name: 'Empresa Teste',
            total_docs: 5,
            docs_valid: 3,
            docs_expired: 2,
            recent_docs: [],
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true
        };

        it('deve buscar as estatísticas do cliente SEM ID de empresa (Geral)', async () => {
            (api.get as any).mockResolvedValueOnce({ data: mockClientStats });

            const result = await dashboardService.getClientStats();

            // A URL não deve ter a query string '?company_id='
            expect(api.get).toHaveBeenCalledWith('/dashboard/client/stats');
            expect(result).toEqual(mockClientStats);
        });

        it('deve buscar as estatísticas do cliente COM ID de empresa (Específico)', async () => {
            (api.get as any).mockResolvedValueOnce({ data: mockClientStats });

            const result = await dashboardService.getClientStats('empresa-123');

            // A URL deve incluir a query string formatada corretamente!
            expect(api.get).toHaveBeenCalledWith('/dashboard/client/stats?company_id=empresa-123');
            expect(result).toEqual(mockClientStats);
        });

        it('deve propagar o erro se a API falhar', async () => {
            const mockError = new Error('Erro ao carregar dashboard cliente');
            (api.get as any).mockRejectedValueOnce(mockError);

            await expect(dashboardService.getClientStats('123')).rejects.toThrow('Erro ao carregar dashboard cliente');
        });
    });
});