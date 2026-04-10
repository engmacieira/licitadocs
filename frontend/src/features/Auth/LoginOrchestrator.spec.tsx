import { render, screen, waitFor } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { LoginOrchestrator } from './LoginOrchestrator';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';

// Mocks
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../services/userService', () => ({
    userService: {
        getMe: vi.fn()
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));



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

describe('LoginOrchestrator', () => {
    const mockSignIn = vi.fn();

    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
        (useAuth as any).mockReturnValue({
            signIn: mockSignIn
        });
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <LoginOrchestrator />
        </MemoryRouter>
    );

    it('deve renderizar o formulário de login corretamente', () => {
        renderComponent();

        expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
        expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
    });

    it('deve exibir mensagens de erro de validação para campos vazios', async () => {
        renderComponent();

        const submitButton = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('O e-mail é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('A senha é obrigatória')).toBeInTheDocument();
        });
    });

    it('deve exibir mensagem de erro para e-mail inválido', async () => {
        renderComponent();

        const emailInput = screen.getByLabelText(/E-mail/i);
        await user.type(emailInput, 'email-invalido');

        const submitButton = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Formato de e-mail inválido')).toBeInTheDocument();
        });
    });

    it('deve realizar login com sucesso e redirecionar para admin se role for admin', async () => {
        mockSignIn.mockResolvedValueOnce(undefined);
        (userService.getMe as any).mockResolvedValueOnce({ role: 'admin' });

        renderComponent();

        const emailInput = screen.getByLabelText(/E-mail/i);
        const passwordInput = screen.getByLabelText(/Senha/i);
        await user.type(emailInput, 'admin@teste.com');
        await user.type(passwordInput, 'senha123');

        const submitButton = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith({
                email: 'admin@teste.com',
                password: 'senha123'
            });
            expect(userService.getMe).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Bem-vindo de volta!');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
        });
    });

    it('deve realizar login com sucesso e redirecionar para a página anterior se role for user', async () => {
        mockSignIn.mockResolvedValueOnce(undefined);
        (userService.getMe as any).mockResolvedValueOnce({ role: 'user' });

        (useLocation as any).mockReturnValue({
            pathname: '/login',
            state: { from: { pathname: '/previous-page' } }
        });

        renderComponent();

        const emailInput = screen.getByLabelText(/E-mail/i);
        const passwordInput = screen.getByLabelText(/Senha/i);
        await user.type(emailInput, 'user@teste.com');
        await user.type(passwordInput, 'senha123');

        const submitButton = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/previous-page', { replace: true });
        });
    });

    it('deve exibir mensagem de erro se o login falhar', async () => {
        mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

        renderComponent();

        const emailInput = screen.getByLabelText(/E-mail/i);
        const passwordInput = screen.getByLabelText(/Senha/i);
        await user.type(emailInput, 'errado@teste.com');
        await user.type(passwordInput, 'senha-errada');

        const submitButton = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas', expect.any(Object));
        });
    });

    it('deve navegar de volta para o site ao clicar no botão "Voltar para o site"', async () => {
        renderComponent();

        const backButton = screen.getByLabelText('Voltar para a página inicial');
        await user.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
