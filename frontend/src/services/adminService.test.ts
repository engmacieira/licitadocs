import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from './adminService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    }
}));

// ==========================================
// 🏭 FÁBRICA DE DADOS (Empresas Falsas)
// ==========================================
const mockCompanies = [
    {
        id: '1',
        razao_social: 'Empresa Aprovada LTDA',
        is_payment_active: true,
        is_admin_verified: true,
        is_contract_signed: true,
        created_at: '2026-01-01',
        cnpj: '11.111.111/0001-11'
    },
    {
        id: '2',
        razao_social: 'Empresa Sem Contrato',
        is_payment_active: false,
        is_admin_verified: false,
        is_contract_signed: false, // <-- Cai no step 'contract'
        created_at: '2026-01-02',
        cnpj: '22.222.222/0001-22'
    },
    {
        id: '3',
        razao_social: 'Empresa Sem Pagamento',
        is_payment_active: false, // <-- Cai no step 'payment'
        is_admin_verified: false,
        is_contract_signed: true,
        created_at: '2026-01-03',
        cnpj: '33.333.333/0001-33'
    },
    {
        id: '4',
        name: 'Empresa para Validar', // Usando 'name' no lugar de 'razao_social' para testar o fallback
        is_payment_active: true,
        is_admin_verified: false, // <-- Cai no step 'validation'
        is_contract_signed: true,
        created_at: '2026-01-04',
        cnpj: '44.444.444/0001-44'
    }
];

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStats()', () => {
        it('deve calcular as estatísticas corretamente com base nos dados da API', async () => {
            // Simulamos a API devolvendo a nossa lista de 4 empresas
            (api.get as any).mockResolvedValueOnce({ data: mockCompanies });

            const stats = await adminService.getStats();

            // Verificações Matemáticas
            expect(api.get).toHaveBeenCalledWith('/companies');
            expect(stats.total_companies).toBe(4); // O total
            expect(stats.active_companies).toBe(2); // IDs 1 e 4 têm is_payment_active = true
            expect(stats.pending_approval).toBe(3); // IDs 2, 3 e 4 têm is_admin_verified = false
            expect(stats.documents_generated_month).toBe(145); // O mock fixo que você deixou lá
        });

        it('deve retornar zeros se a chamada à API falhar (Caminho Triste)', async () => {
            // Simulamos uma queda de internet ou erro 500 no backend
            (api.get as any).mockRejectedValueOnce(new Error('Network Error'));

            const stats = await adminService.getStats();

            expect(stats).toEqual({
                total_companies: 0,
                active_companies: 0,
                pending_approval: 0,
                documents_generated_month: 0
            });
        });
    });

    describe('getPendingQueue()', () => {
        it('deve filtrar e mapear corretamente os passos da fila de pendências', async () => {
            (api.get as any).mockResolvedValueOnce({ data: mockCompanies });

            const queue = await adminService.getPendingQueue();

            expect(api.get).toHaveBeenCalledWith('/companies');

            // A "Empresa 1" não deve aparecer na fila porque já é verificada
            expect(queue.length).toBe(3);

            // Verifica se a lógica do "Step" (passo atual) está a funcionar
            expect(queue.find(q => q.company_id === '2')?.step).toBe('contract');
            expect(queue.find(q => q.company_id === '3')?.step).toBe('payment');

            // Verifica a empresa 4: tem de estar no passo 'validation' e usar o fallback de nome ('name')
            const emp4 = queue.find(q => q.company_id === '4');
            expect(emp4?.step).toBe('validation');
            expect(emp4?.company_name).toBe('Empresa para Validar');
        });

        it('deve lidar com empresas sem nome devolvendo um fallback genérico', async () => {
            const empresaSemNome = [{ ...mockCompanies[1], razao_social: null, name: null }];
            (api.get as any).mockResolvedValueOnce({ data: empresaSemNome });

            const queue = await adminService.getPendingQueue();

            expect(queue[0].company_name).toBe('Empresa sem nome');
        });

        it('deve retornar um array vazio se a chamada à API falhar', async () => {
            (api.get as any).mockRejectedValueOnce(new Error('Internal Server Error'));

            const queue = await adminService.getPendingQueue();

            expect(queue).toEqual([]);
        });
    });
});