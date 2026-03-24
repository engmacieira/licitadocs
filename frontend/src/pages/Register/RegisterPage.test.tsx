import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from './index';

// Mock do react-router-dom
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
    Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>
}));

// Mock do AuthContext (usado pelo RegisterWizard)
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: vi.fn(),
        isAuthenticated: false,
        loading: false
    })
}));

describe('RegisterPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o wizard de registro no primeiro passo (Empresa)', () => {
        render(<RegisterPage />);

        // Verifica o título principal
        expect(screen.getByText('Crie sua conta')).toBeInTheDocument();

        // Verifica o indicador de progresso
        expect(screen.getAllByText(/Passo/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/1/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Empresa/i).length).toBeGreaterThan(0);

        // Verifica campos de entrada do Passo 1 (Empresa)
        expect(screen.getByLabelText(/CNPJ/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nome Fantasia/i)).toBeInTheDocument();

        // Verifica o botão de próximo passo
        expect(screen.getByRole('button', { name: /Próximo/i })).toBeInTheDocument();
    });

    it('deve navegar de volta para a home ao clicar no botão Voltar', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        const backButton = screen.getByText(/Voltar para o site/i);
        await user.click(backButton);

        expect(navigate).toHaveBeenCalledWith('/');
    });

    it('deve fornecer link para a página de login', () => {
        render(<RegisterPage />);
        const loginLink = screen.getByRole('link', { name: /Fazer login/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });
});
