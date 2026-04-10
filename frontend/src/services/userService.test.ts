import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getMyCompanies should call correct endpoint', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
        await userService.getMyCompanies();
        expect(api.get).toHaveBeenCalledWith('/users/me/companies');
    });

    it('getMe should call correct endpoint', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'u1', email: 'u@e.com' } });
        await userService.getMe();
        expect(api.get).toHaveBeenCalledWith('/users/me');
    });

    it('updateMe should call patch endpoint with payload', async () => {
        const payload = { nome: 'New Name' };
        vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'u1', ...payload } });
        await userService.updateMe(payload);
        expect(api.patch).toHaveBeenCalledWith('/users/me', payload);
    });

    it('updateMe should handle password change correctly', async () => {
        const payload = { password: 'new-password', current_password: 'old-password' };
        vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'u1' } });
        await userService.updateMe(payload);
        expect(api.patch).toHaveBeenCalledWith('/users/me', payload);
    });

    it('should throw error when API fails (Error Handling)', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('Auth failed'));
        await expect(userService.getMe()).rejects.toThrow('Auth failed');
    });
});
