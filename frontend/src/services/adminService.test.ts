import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from './adminService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStats', () => {
        it('should fetch companies and calculate statistics correctly (Happy Path)', async () => {
            const mockCompanies = [
                { id: '1', is_payment_active: true, is_admin_verified: true },
                { id: '2', is_payment_active: false, is_admin_verified: false },
                { id: '3', is_payment_active: true, is_admin_verified: false },
            ];
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockCompanies });

            const stats = await adminService.getStats();

            expect(api.get).toHaveBeenCalledWith('/companies');
            expect(stats).toEqual({
                total_companies: 3,
                active_companies: 2,
                pending_approval: 2,
                documents_generated_month: 145,
            });
        });

        it('should return default stats and log error when API fails (Error Handling)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

            const stats = await adminService.getStats();

            expect(stats).toEqual({
                total_companies: 0,
                active_companies: 0,
                pending_approval: 0,
                documents_generated_month: 0,
            });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getPendingQueue', () => {
        it('should filter and map pending companies correctly (Happy Path)', async () => {
            const mockCompanies = [
                { 
                    id: '1', 
                    razao_social: 'Company A', 
                    cnpj: '111', 
                    is_admin_verified: false, 
                    is_contract_signed: false, 
                    is_payment_active: false,
                    created_at: '2023-01-01'
                },
                { 
                    id: '2', 
                    nome_fantasia: 'Company B',
                    cnpj: '222', 
                    is_admin_verified: false, 
                    is_contract_signed: true, 
                    is_payment_active: false,
                    created_at: '2023-01-02'
                },
                { 
                    id: '3', 
                    razao_social: 'Company C', 
                    cnpj: '333', 
                    is_admin_verified: false, 
                    is_contract_signed: true, 
                    is_payment_active: true,
                    created_at: '2023-01-03'
                },
                { 
                    id: '4', 
                    is_admin_verified: true 
                },
            ];
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockCompanies });

            const queue = await adminService.getPendingQueue();

            expect(queue).toHaveLength(3);
            expect(queue[0]).toEqual({
                company_id: '1',
                company_name: 'Company A',
                step: 'contract',
                date: '2023-01-01',
                cnpj: '111'
            });
            expect(queue[1]).toEqual({
                company_id: '2',
                company_name: 'Company B',
                step: 'payment',
                date: '2023-01-02',
                cnpj: '222'
            });
            expect(queue[2]).toEqual({
                company_id: '3',
                company_name: 'Company C',
                step: 'validation',
                date: '2023-01-03',
                cnpj: '333'
            });
        });

        it('should handle company name fallbacks correctly', async () => {
            const mockCompanies = [
                { id: '1', is_admin_verified: false, razao_social: 'Name Only' },
                { id: '2', is_admin_verified: false },
            ];
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockCompanies });

            const queue = await adminService.getPendingQueue();

            expect(queue[0].company_name).toBe('Name Only');
            expect(queue[1].company_name).toBe('Empresa sem nome');
        });

        it('should return empty array and log error when API fails (Error Handling)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

            const queue = await adminService.getPendingQueue();

            expect(queue).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
