import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emissionRequestService } from './emissionRequestService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('emissionRequestService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getByRuleAndCompany should return mapped items with Date objects', async () => {
        const mockData = [
            { id: '1', date: '2023-01-01T10:00:00Z', companyId: 'c1', companyName: 'C1', estimatedDate: '2023-01-10', status: 'pending' }
        ];
        vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

        const result = await emissionRequestService.getByRuleAndCompany('rule-1', 'comp-1');

        expect(api.get).toHaveBeenCalledWith('/emission-rules/rule-1/requests', { params: { company_id: 'comp-1' } });
        expect(result[0].date).toBeInstanceOf(Date);
        expect(result[0].date.toISOString()).toBe('2023-01-01T10:00:00.000Z');
    });

    it('create should return mapped item with Date object', async () => {
        const mockData = { id: '2', date: '2023-01-02T10:00:00Z', companyId: 'c1', companyName: 'C1', estimatedDate: '2023-01-12', status: 'pending' };
        vi.mocked(api.post).mockResolvedValueOnce({ data: mockData });

        const result = await emissionRequestService.create('rule-1', 'comp-1');

        expect(api.post).toHaveBeenCalledWith('/emission-rules/rule-1/requests', { company_id: 'comp-1' });
        expect(result.date).toBeInstanceOf(Date);
        expect(result.date.toISOString()).toBe('2023-01-02T10:00:00.000Z');
    });

    it('update should call api.patch with correct URL and payload', async () => {
        vi.mocked(api.patch).mockResolvedValueOnce({});

        const payload = { status: 'completed' };
        await emissionRequestService.update('req-1', payload);

        expect(api.patch).toHaveBeenCalledWith('/emission-rules/requests/req-1', payload);
    });

    it('should throw error when API fails (Error Handling)', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('API Fail'));
        await expect(emissionRequestService.getByRuleAndCompany('r', 'c')).rejects.toThrow('API Fail');
    });
});
