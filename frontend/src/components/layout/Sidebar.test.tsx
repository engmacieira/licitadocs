import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 1. Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// 2. Mock do useNavigate do React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Sidebar Component', () => {
    const mockSignOut = vi.fn();
    const mockSwitchCompany = vi.fn();

    const clientAuthMock = {
        user: { sub: 'cliente@teste.com', role: 'client' },
        signOut: mockSignOut,
        companies: [{ id: '1', razao_social: 'Empresa A' }, { id: '2', razao_social: 'Empresa B' }],
        currentCompany: { id: '1', razao_social: 'Empresa A', role: 'MASTER' },
        switchCompany: mockSwitchCompany,
    };

    const adminAuthMock = {
        user: { sub: 'admin@licitadoc.com', role: 'admin' },
        signOut: mockSignOut,
        companies: [],
        currentCompany: null,
        switchCompany: mockSwitchCompany,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a visão de CLIENTE com seletor de empresas', () => {
        // Injeta os dados de Cliente no Mock
        (useAuth as any).mockReturnValue(clientAuthMock);

        // MemoryRouter simula que estamos na rota '/documents'
        render(
            <MemoryRouter initialEntries={['/documents']}>
                <Sidebar />
            </MemoryRouter>
        );

        // Verifica os links específicos de cliente
        expect(screen.getByText('Meus Documentos')).toBeInTheDocument();
        expect(screen.getByText('Minha Empresa')).toBeInTheDocument();

        // O Admin não deve aparecer
        expect(screen.queryByText('Modo Administrador')).not.toBeInTheDocument();

        // Verifica se a empresa atual aparece no dropdown
        // "Empresa A" aparece no botão principal e na lista do dropdown!
        expect(screen.getAllByText('Empresa A').length).toBeGreaterThan(0);
    });

    it('deve renderizar a visão de ADMIN sem seletor de empresas', () => {
        (useAuth as any).mockReturnValue(adminAuthMock);

        render(
            <MemoryRouter initialEntries={['/admin/dashboard']}>
                <Sidebar />
            </MemoryRouter>
        );

        // Verifica os links de Admin
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
        expect(screen.getByText('Upload Centralizado')).toBeInTheDocument();

        // A flag de Administrador deve estar visível
        expect(screen.getByText('Modo Administrador')).toBeInTheDocument();
    });

    it('deve fazer logout e redirecionar ao clicar em Sair', async () => {
        (useAuth as any).mockReturnValue(clientAuthMock);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        // Clica no botão Sair
        const logoutButton = screen.getByText('Sair');
        await user.click(logoutButton);

        // Verifica se chamou a função signOut do Contexto
        expect(mockSignOut).toHaveBeenCalled();
        // Verifica se o React Router mandou para o Login
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});