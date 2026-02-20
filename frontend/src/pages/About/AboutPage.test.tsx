import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AboutPage } from './index';

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

describe('AboutPage integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar os pilares institucionais: Missão, Visão e DNA', () => {
        render(
            <MemoryRouter>
                <AboutPage />
            </MemoryRouter>
        );

        // Verifica o Hero
        expect(screen.getByText(/Tecnologia Portuguesa/i)).toBeInTheDocument();

        // Verifica a Missão
        expect(screen.getByText('A Nossa Missão')).toBeInTheDocument();

        // Verifica os Valores (DNA)
        expect(screen.getByText('O Nosso DNA')).toBeInTheDocument();
        expect(screen.getByText('Inovação Constante')).toBeInTheDocument();
        expect(screen.getByText('Ética e Transparência')).toBeInTheDocument();
    });

    it('deve permitir ao utilizador voltar para a Landing Page pelo Header', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AboutPage />
            </MemoryRouter>
        );

        const backBtn = screen.getByRole('button', { name: /voltar/i });
        await user.click(backBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('deve navegar corretamente através das opções do Header e CTA Final', async () => {
        const user = userEvent.setup();
        const { unmount } = render(
            <MemoryRouter>
                <AboutPage />
            </MemoryRouter>
        );

        // 1. Testa botão "Entrar" no Header
        const loginBtn = screen.getByRole('button', { name: 'Entrar' });
        await user.click(loginBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/login');

        // 2. Testa botão "Criar Conta Agora" no CTA Final
        const registerBtn = screen.getByRole('button', { name: /Criar Conta Agora/i });
        await user.click(registerBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/register');

        // 3. Testa botão "Ver Demonstração"
        const demoBtn = screen.getByRole('button', { name: /Ver Demonstração/i });
        await user.click(demoBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/demonstracao');
    });

    it('deve exibir o rodapé institucional com copyright atualizado', () => {
        render(
            <MemoryRouter>
                <AboutPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/© 2026 LicitaDoc Tecnologia S.A./i)).toBeInTheDocument();
    });
});