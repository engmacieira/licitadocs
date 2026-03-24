import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companyService } from './companyService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('companyService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getTeam should call api.get with correct URL', async () => {
        const mockData = [{ user_id: '1', name: 'John', email: 'john@example.com', role: 'MASTER', status: true, joined_at: '2023-01-01' }];
        vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

        const result = await companyService.getTeam('comp-123');

        expect(api.get).toHaveBeenCalledWith('/companies/comp-123/members');
        expect(result).toEqual(mockData);
    });

    it('update should call api.put with correct URL and payload', async () => {
        const payload = { razao_social: 'New Name' };
        const mockResponse = { id: 'comp-123', ...payload };
        vi.mocked(api.put).mockResolvedValueOnce({ data: mockResponse });

        const result = await companyService.update('comp-123', payload);

        expect(api.put).toHaveBeenCalledWith('/companies/comp-123', payload);
        expect(result).toEqual(mockResponse);
    });

    it('inviteMember should call api.post with correct URL and payload', async () => {
        const payload = { email: 'new@example.com', role: 'VIEWER' as const };
        const mockResponse = { user_id: 'user-456', email: 'new@example.com', role: 'VIEWER', message: 'Invited' };
        vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

        const result = await companyService.inviteMember('comp-123', payload);

        expect(api.post).toHaveBeenCalledWith('/companies/comp-123/members', payload);
        expect(result).toEqual(mockResponse);
    });

    it('updateMemberRole should call api.put with correct URL and payload', async () => {
        vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });

        await companyService.updateMemberRole('comp-123', 'user-456', 'MASTER');

        expect(api.put).toHaveBeenCalledWith('/companies/comp-123/members/user-456', { role: 'MASTER' });
    });

    it('removeMember should call api.delete with correct URL', async () => {
        vi.mocked(api.delete).mockResolvedValueOnce({});

        await companyService.removeMember('comp-123', 'user-456');

        expect(api.delete).toHaveBeenCalledWith('/companies/comp-123/members/user-456');
    });

    it('getAll should call api.get with correct URL', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

        await companyService.getAll();

        expect(api.get).toHaveBeenCalledWith('/companies');
    });

    it('getById should call api.get with correct URL', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'comp-123' } });

        await companyService.getById('comp-123');

        expect(api.get).toHaveBeenCalledWith('/companies/comp-123');
    });

    it('create should call api.post with correct URL and payload', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-comp' } });

        await companyService.create({ name: 'New Comp', cnpj: '123456789' });

        expect(api.post).toHaveBeenCalledWith('/companies', { name: 'New Comp', cnpj: '123456789' });
    });

    it('should throw error when API fails (Error Handling)', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));
        await expect(companyService.getTeam('123')).rejects.toThrow('Network error');
    });
});
