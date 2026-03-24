import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './index';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mocks
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('./CompanySelector', () => ({
    CompanySelector: () => <div data-testid="company-selector">CompanySelector</div>,
}));

vi.mock('./Navigation', () => ({
    Navigation: ({ isAdmin }: { isAdmin: boolean }) => <div data-testid="navigation">Navigation {isAdmin ? 'Admin' : 'User'}</div>,
}));

vi.mock('./UserFooter', () => ({
    UserFooter: () => <div data-testid="user-footer">UserFooter</div>,
}));

describe('Sidebar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders header, navigation and footer for client user', () => {
        (useAuth as any).mockReturnValue({
            user: { role: 'user' },
        });

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('LicitaDoc')).toBeInTheDocument();
        expect(screen.getByTestId('company-selector')).toBeInTheDocument();
        expect(screen.getByText('Navigation User')).toBeInTheDocument();
        expect(screen.getByTestId('user-footer')).toBeInTheDocument();
        expect(screen.queryByText('Modo Administrador')).not.toBeInTheDocument();
    });

    it('renders admin header and navigation for admin user', () => {
        (useAuth as any).mockReturnValue({
            user: { role: 'admin' },
        });

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('Modo Administrador')).toBeInTheDocument();
        expect(screen.getByText('Navigation Admin')).toBeInTheDocument();
        expect(screen.queryByTestId('company-selector')).not.toBeInTheDocument();
        
        // Check for purple background on icon for admin
        const iconContainer = screen.getByText('LicitaDoc').previousSibling;
        expect(iconContainer).toHaveClass('bg-purple-600');
    });

    it('applies custom className', () => {
        (useAuth as any).mockReturnValue({
            user: { role: 'user' },
        });

        render(
            <MemoryRouter>
                <Sidebar className="custom-class" />
            </MemoryRouter>
        );

        const aside = screen.getByRole('complementary');
        expect(aside).toHaveClass('custom-class');
    });
});
