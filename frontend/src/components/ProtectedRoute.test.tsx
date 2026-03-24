import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading spinner when loading is true', () => {
        (useAuth as any).mockReturnValue({
            loading: true,
            isAuthenticated: false,
            user: null,
        });

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div data-testid="protected-content">Protected</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText(/verificando credenciais/i)).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to home when not authenticated', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: false,
            user: null,
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/" element={<div data-testid="login-page">Login/Home</div>} />
                    <Route 
                        path="/protected" 
                        element={
                            <ProtectedRoute>
                                <div data-testid="protected-content">Protected</div>
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders restricted access screen when user role is not allowed', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'user' },
        });

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['admin']}>
                    <div data-testid="protected-content">Protected</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText(/acesso restrito/i)).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated and role is allowed', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'admin' },
        });

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['admin']}>
                    <div data-testid="protected-content">Protected</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText(/acesso restrito/i)).not.toBeInTheDocument();
    });

    it('renders children when authenticated and no allowedRoles defined', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'user' },
        });

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div data-testid="protected-content">Protected</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('calls window.history.back when Voltar button is clicked in restricted screen', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'user' },
        });

        const backSpy = vi.spyOn(window.history, 'back');

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['admin']}>
                    <div>Protected</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        const backButton = screen.getByRole('button', { name: /voltar/i });
        fireEvent.click(backButton);

        expect(backSpy).toHaveBeenCalled();
    });
});
