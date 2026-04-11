import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { userService, type UserCompany } from '../services/userService';
import * as jwtDecodeModule from 'jwt-decode';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mocking dependencies
vi.mock('../services/authService');
vi.mock('../services/userService');
vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(),
}));

const mockToken = 'mock-access-token';
const mockUser = {
    id: 'user-123',
    sub: 'test@example.com',
    email: 'test@example.com',
    nome: 'Usuário Teste',
    is_active: true,
    role: 'client',
    user_id: 'u-1',
    exp: Math.floor(Date.now() / 1000) + 3600,
    is_email_verified: true
};

const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    is_active: true,
    role: 'client',
    nome: 'Test User',
    is_email_verified: true
};

const mockCompanies: UserCompany[] = [
    { id: 'comp-1', razao_social: 'Company One', cnpj: '11.111.111/0001-11', role: 'MASTER', status: true, created_at: '2023-01-01' },
    { id: 'comp-2', razao_social: 'Company Two', cnpj: '22.222.222/0001-22', role: 'VIEWER', status: true, created_at: '2023-01-02' }
];

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Default mock implementations
        vi.mocked(authService.signIn).mockResolvedValue({ access_token: mockToken, token_type: 'bearer' });
        vi.mocked(userService.getMe).mockResolvedValue(mockProfile);
        vi.mocked(userService.getMyCompanies).mockResolvedValue(mockCompanies);
        vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValue(mockUser);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    it('starts in loading state and then becomes not authenticated if no token', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('restores session if a valid token exists in localStorage', async () => {
        localStorage.setItem('@LicitaDoc:token', mockToken);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(userService.getMe).toHaveBeenCalled();
        expect(userService.getMyCompanies).toHaveBeenCalled();
    });

    it('clears session if token in localStorage is expired', async () => {
        const expiredUser = { ...mockUser, exp: Math.floor(Date.now() / 1000) - 3600 };
        vi.mocked(jwtDecodeModule.jwtDecode).mockReturnValue(expiredUser);
        localStorage.setItem('@LicitaDoc:token', 'expired-token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
    });

    it('performs signIn successfully', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.signIn({ email: 'test@example.com', password: 'password123' });
        });

        expect(authService.signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
        expect(localStorage.getItem('@LicitaDoc:token')).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.userProfile).toEqual(mockProfile);
    });

    it('performs signOut and clears state and localStorage', async () => {
        localStorage.setItem('@LicitaDoc:token', mockToken);
        localStorage.setItem('@LicitaDoc:companyId', 'comp-1');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

        act(() => {
            result.current.signOut();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.userProfile).toBeNull();
        expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
        expect(localStorage.getItem('@LicitaDoc:companyId')).toBeNull();
    });

    it('switches current company successfully', async () => {
        localStorage.setItem('@LicitaDoc:token', mockToken);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.companies.length).toBeGreaterThan(0));

        act(() => {
            result.current.switchCompany('comp-2');
        });

        expect(result.current.currentCompany?.id).toBe('comp-2');
        expect(localStorage.getItem('@LicitaDoc:companyId')).toBe('comp-2');
    });

    it('loads previously selected company from localStorage on mount', async () => {
        localStorage.setItem('@LicitaDoc:token', mockToken);
        localStorage.setItem('@LicitaDoc:companyId', 'comp-2');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.currentCompany).not.toBeNull());

        expect(result.current.currentCompany?.id).toBe('comp-2');
    });

    it('logs error and continues if profile loading fails during restoration', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        localStorage.setItem('@LicitaDoc:token', mockToken);
        vi.mocked(userService.getMe).mockRejectedValue(new Error('API Failure'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isAuthenticated).toBe(true); // Token is still valid
        expect(result.current.userProfile).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
