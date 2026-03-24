import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './index';

// Mock do react-router-dom
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
    useLocation: () => ({ state: {} }),
    Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>
}));

// Mock do AuthContext (usado pelo LoginOrchestrator)
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: vi.fn(),
        isAuthenticated: false,
        loading: false
    })
}));

describe('LoginPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o orquestrador de login com os elementos principais', () => {
        render(<LoginPage />);

        // Verifica o título do formulário
        expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();

        // Verifica campos de entrada
        expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();

        // Verifica o botão de submissão
        expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
    });

    it('deve navegar de volta para a home ao clicar no botão Voltar', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const backButton = screen.getByLabelText(/Voltar para a página inicial/i);
        await user.click(backButton);

        expect(navigate).toHaveBeenCalledWith('/');
    });
});
