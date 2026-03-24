import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from './dashboardService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('dashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAdminStats', () => {
        it('should call api.get with correct URL (Happy Path)', async () => {
            const mockData = { total_companies: 10, total_documents: 50, total_users: 20, recent_documents: [], recent_companies: [] };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

            const result = await dashboardService.getAdminStats();

            expect(api.get).toHaveBeenCalledWith('/dashboard/admin/stats');
            expect(result).toEqual(mockData);
        });
    });

    describe('getClientStats', () => {
        it('should call api.get with base URL when no companyId is provided', async () => {
            const mockData = { company_name: 'Test', total_docs: 5, docs_valid: 4, docs_expired: 1, recent_docs: [], is_contract_signed: true, is_payment_active: true, is_admin_verified: true };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

            const result = await dashboardService.getClientStats();

            expect(api.get).toHaveBeenCalledWith('/dashboard/client/stats');
            expect(result).toEqual(mockData);
        });

        it('should call api.get with query param when companyId is provided', async () => {
            const mockData = { company_name: 'Test', total_docs: 5, docs_valid: 4, docs_expired: 1, recent_docs: [], is_contract_signed: true, is_payment_active: true, is_admin_verified: true };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

            const result = await dashboardService.getClientStats('comp-123');

            expect(api.get).toHaveBeenCalledWith('/dashboard/client/stats?company_id=comp-123');
            expect(result).toEqual(mockData);
        });
    });

    it('should throw error when API fails (Error Handling)', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));
        await expect(dashboardService.getAdminStats()).rejects.toThrow('API Error');
    });
});
