import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emissionRuleService } from './emissionRuleService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('emissionRuleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAll should call correct endpoint', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
        await emissionRuleService.getAll();
        expect(api.get).toHaveBeenCalledWith('/emission-rules/');
    });

    it('getById should call correct endpoint', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: { id: '1' } });
        await emissionRuleService.getById('1');
        expect(api.get).toHaveBeenCalledWith('/emission-rules/1');
    });

    it('create should call correct endpoint with payload', async () => {
        const payload = { document_type_id: 'dt1', state: 'SP', city: 'Sao Paulo' };
        vi.mocked(api.post).mockResolvedValueOnce({ data: { id: '1', ...payload } });
        await emissionRuleService.create(payload as any);
        expect(api.post).toHaveBeenCalledWith('/emission-rules/', payload);
    });

    it('update should call correct endpoint with payload', async () => {
        const payload = { contact_email: 'test@example.com' };
        vi.mocked(api.put).mockResolvedValueOnce({ data: { id: '1', ...payload } });
        await emissionRuleService.update('1', payload);
        expect(api.put).toHaveBeenCalledWith('/emission-rules/1', payload);
    });

    it('delete should call correct endpoint', async () => {
        vi.mocked(api.delete).mockResolvedValueOnce({});
        await emissionRuleService.delete('1');
        expect(api.delete).toHaveBeenCalledWith('/emission-rules/1');
    });

    describe('resolveLink', () => {
        it('should call resolve endpoint with query params', async () => {
            const mockRule = { id: '1', emission_link: 'http://link' };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockRule });

            const result = await emissionRuleService.resolveLink('dt1', 'c1');

            expect(api.get).toHaveBeenCalledWith('/emission-rules/resolve', {
                params: { document_type_id: 'dt1', company_id: 'c1' }
            });
            expect(result).toEqual(mockRule);
        });

        it('should return null when API throws (e.g. 404)', async () => {
            vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 404 } });

            const result = await emissionRuleService.resolveLink('dt1', 'c1');

            expect(result).toBeNull();
        });
    });
});
