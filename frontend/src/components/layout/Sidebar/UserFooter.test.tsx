import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserFooter } from './UserFooter';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

// Mock do useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('UserFooter Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { sub: 'John Doe', role: 'user' },
            signOut: mockSignOut,
        });
    });

    it('renders user initials, name and role description', () => {
        render(
            <MemoryRouter>
                <UserFooter />
            </MemoryRouter>
        );

        expect(screen.getByText('JO')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
    });

    it('renders "Administrador" role description for admin users', () => {
        (useAuth as any).mockReturnValue({
            user: { sub: 'Admin User', role: 'admin' },
            signOut: mockSignOut,
        });

        render(
            <MemoryRouter>
                <UserFooter />
            </MemoryRouter>
        );

        expect(screen.getByText('Administrador')).toBeInTheDocument();
    });

    it('calls signOut and navigates to login when logout button is clicked', () => {
        render(
            <MemoryRouter>
                <UserFooter />
            </MemoryRouter>
        );

        const logoutButton = screen.getByRole('button', { name: /sair/i });
        fireEvent.click(logoutButton);

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
