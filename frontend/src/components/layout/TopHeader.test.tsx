import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TopHeader } from './TopHeader';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock do react-router-dom para useLocation (MemoryRouter já cuida disso)
const mockOnOpenMobileMenu = vi.fn();

describe('TopHeader Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { sub: 'Test User', role: 'admin' },
        });
    });

    it('renders the dynamic title based on route', () => {
        render(
            <MemoryRouter initialEntries={['/documents']}>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText(/meus documentos/i)).toBeInTheDocument();
    });

    it('renders default title for unknown routes', () => {
        render(
            <MemoryRouter initialEntries={['/unknown']}>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText('LicitaDoc')).toBeInTheDocument();
    });

    it('displays user name and role', () => {
        render(
            <MemoryRouter>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('applies different styling for admin role', () => {
        const { rerender } = render(
            <MemoryRouter>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText('admin')).toHaveClass('bg-purple-100');

        (useAuth as any).mockReturnValue({
            user: { sub: 'Normal User', role: 'user' },
        });

        rerender(
            <MemoryRouter>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText('user')).toHaveClass('bg-blue-100');
    });

    it('calls onOpenMobileMenu when mobile menu button is clicked', () => {
        render(
            <MemoryRouter>
                <TopHeader onOpenMobileMenu={mockOnOpenMobileMenu} />
            </MemoryRouter>
        );

        const menuButton = screen.getByLabelText(/abrir menu de navegação/i);
        fireEvent.click(menuButton);

        expect(mockOnOpenMobileMenu).toHaveBeenCalledTimes(1);
    });
});
