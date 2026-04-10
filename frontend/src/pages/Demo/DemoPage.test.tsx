import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoPage } from './index';

// Mock do react-router-dom


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});
const navigate = mockNavigate;

describe('DemoPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar os pilares de valor e elementos principais', () => {
        render(<DemoPage />);

        // Verifica o título principal
        expect(screen.getByText(/Veja como mantemos o seu/i)).toBeInTheDocument();
        expect(screen.getAllByText('LicitaDocs').length).toBeGreaterThan(0);

        // Verifica as seções de pilares (Features)
        expect(screen.getByText('Monitoramento e Renovação Ativa')).toBeInTheDocument();
        expect(screen.getByText('Cofre Digital Seguro e Compartilhado')).toBeInTheDocument();
        expect(screen.getByText('Ferramentas e Apoio Especializado')).toBeInTheDocument();

        // Verifica o bloco de preço
        expect(screen.getByText('178')).toBeInTheDocument();
        expect(screen.getByText(/O equivalente a apenas/i)).toBeInTheDocument();
    });

    it('deve navegar de volta para a home ao clicar no botão Voltar', async () => {
        const user = userEvent.setup();
        render(<DemoPage />);

        const backButton = screen.getByLabelText(/Voltar para a página inicial/i);
        await user.click(backButton);

        expect(navigate).toHaveBeenCalledWith('/');
    });

    it('deve navegar para registro ao clicar no CTAfinal', async () => {
        const user = userEvent.setup();
        render(<DemoPage />);

        const registerCTA = screen.getByRole('button', { name: /Quero Assinar Agora/i });
        await user.click(registerCTA);

        expect(navigate).toHaveBeenCalledWith('/register');
    });
});
