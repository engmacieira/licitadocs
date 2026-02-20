import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DemoPage } from './index';

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

describe('DemoPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar os três pilares principais da plataforma', () => {
        render(
            <MemoryRouter>
                <DemoPage />
            </MemoryRouter>
        );

        // Verifica Pilar 1: Automação
        expect(screen.getByText('Certidões Automáticas')).toBeInTheDocument();

        // Verifica Pilar 2: Cofre
        expect(screen.getByText('Seu Cofre Inviolável')).toBeInTheDocument();

        // Verifica Pilar 3: IA
        expect(screen.getByText('Consultoria Jurídica via IA')).toBeInTheDocument();
    });

    it('deve permitir voltar para a página inicial através do botão de retorno', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <DemoPage />
            </MemoryRouter>
        );

        const backBtn = screen.getByRole('button', { name: /Voltar para Início/i });
        await user.click(backBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('deve levar o usuário para o registro ao clicar no CTA "Começar Agora"', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <DemoPage />
            </MemoryRouter>
        );

        const ctaBtn = screen.getByRole('button', { name: /Começar Agora/i });
        await user.click(ctaBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('deve exibir os exemplos de certidões e alertas de segurança', () => {
        render(
            <MemoryRouter>
                <DemoPage />
            </MemoryRouter>
        );

        // Verifica se os exemplos fictícios de CND estão na tela
        expect(screen.getByText('CND Federal (Receita/PGFN)')).toBeInTheDocument();
        expect(screen.getByText('FGTS (CRF)')).toBeInTheDocument();

        // Verifica as tags de segurança do Cofre
        expect(screen.getByText('Alertas de Vencimento')).toBeInTheDocument();
        expect(screen.getByText('Segurança Bancária')).toBeInTheDocument();
    });

    it('deve exibir o rodapé com o ano correto (2026)', () => {
        render(
            <MemoryRouter>
                <DemoPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/© 2026 LicitaDoc/i)).toBeInTheDocument();
    });
});