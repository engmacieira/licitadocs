import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navigation } from './Navigation';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Navigation Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            currentCompany: { role: 'MASTER' },
        });
    });

    it('renders user navigation links for non-admin users', () => {
        render(
            <MemoryRouter>
                <Navigation isAdmin={false} />
            </MemoryRouter>
        );

        expect(screen.getByText(/visão geral/i)).toBeInTheDocument();
        expect(screen.getByText(/meus documentos/i)).toBeInTheDocument();
        expect(screen.getByText(/modelos de documentos/i)).toBeInTheDocument();
        expect(screen.getByText(/ajuda e suporte/i)).toBeInTheDocument();
        expect(screen.getByText(/assinatura/i)).toBeInTheDocument();
        expect(screen.getByText(/minha empresa/i)).toBeInTheDocument();
    });

    it('does not render "Minha Empresa" for non-master users', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: { role: 'USER' },
        });

        render(
            <MemoryRouter>
                <Navigation isAdmin={false} />
            </MemoryRouter>
        );

        expect(screen.queryByText(/minha empresa/i)).not.toBeInTheDocument();
    });

    it('renders admin navigation links for admin users', () => {
        render(
            <MemoryRouter>
                <Navigation isAdmin={true} />
            </MemoryRouter>
        );

        expect(screen.getByText(/gestão de empresas/i)).toBeInTheDocument();
        expect(screen.getByText(/upload centralizado/i)).toBeInTheDocument();
        expect(screen.getByText(/monitor de vencimento/i)).toBeInTheDocument();
        expect(screen.getByText(/regras de emissão/i)).toBeInTheDocument();
    });

    it('applies active styles based on route', () => {
        render(
            <MemoryRouter initialEntries={['/documents']}>
                <Navigation isAdmin={false} />
            </MemoryRouter>
        );

        const navItem = screen.getByText(/meus documentos/i).closest('a');
        expect(navItem).toHaveClass('bg-blue-600');
        expect(navItem).toHaveClass('text-white');
    });

    it('applies active styles for admin routes', () => {
        render(
            <MemoryRouter initialEntries={['/admin/companies']}>
                <Navigation isAdmin={true} />
            </MemoryRouter>
        );

        const navItem = screen.getByText(/gestão de empresas/i).closest('a');
        expect(navItem).toHaveClass('bg-purple-600');
    });
});
