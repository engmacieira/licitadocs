import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './index';

// ==========================================
// 🎭 MOCK DO NAVEGADOR (Router)
// ==========================================
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LandingPage Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a marca e a proposta de valor principal', () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        // Verifica a presença do Logo/Nome
        expect(screen.getByText('LicitaDocs')).toBeInTheDocument();

        // Verifica o título principal (Hero)
        expect(screen.getByText(/sem você mover um dedo/i)).toBeInTheDocument();

        // Verifica se os cards de funcionalidades estão visíveis
        expect(screen.getByText('Renovação Automática')).toBeInTheDocument();
        expect(screen.getByText('Sempre Habilitado')).toBeInTheDocument();
    });

    it('deve navegar para a página de Login ao clicar no botão do cabeçalho', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        // Busca o botão de Login e clica
        const loginBtn = screen.getByRole('button', { name: /login/i });
        await user.click(loginBtn);

        // Verifica se o navigate foi chamado com a rota correta
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('deve navegar para a página de Registro ao clicar em "Quero Contratar"', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        // Busca o botão de conversão principal
        const registerBtn = screen.getByRole('button', { name: /quero contratar/i });
        await user.click(registerBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('deve exibir as informações de rodapé com o ano correto', () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        // Verifica se o copyright está presente
        expect(screen.getByText(/© 2026 LicitaDocs/i)).toBeInTheDocument();
    });
});