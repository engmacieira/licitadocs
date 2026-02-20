import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './index';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
const mockSignIn = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ signIn: mockSignIn }),
}));

vi.mock('../../services/userService', () => ({
    userService: {
        getMe: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { from: { pathname: '/rota-protegida' } } }),
    };
});

describe('LoginPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o formulário e os textos institucionais', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
        expect(screen.getByText('Automação inteligente para suas licitações')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
    });

    it('deve exibir erros de validação do Zod se os campos estiverem vazios', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        const submitBtn = screen.getByRole('button', { name: /Entrar na Plataforma/i });
        await user.click(submitBtn);

        // Aguarda o React Hook Form processar o Zod
        await waitFor(() => {
            expect(screen.getByText('O e-mail é obrigatório')).toBeInTheDocument();
            expect(screen.getByText('A senha é obrigatória')).toBeInTheDocument();
        });

        // O serviço não deve ser chamado
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('deve fazer login como CLIENTE e redirecionar para a rota original', async () => {
        const user = userEvent.setup();

        // Simula o signIn dando certo
        mockSignIn.mockResolvedValueOnce({});

        // Simula o perfil retornando role padrão (Cliente)
        (userService.getMe as any).mockResolvedValueOnce({ role: 'client', email: 'cliente@teste.com' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText('E-mail'), 'cliente@teste.com');
        await user.type(screen.getByLabelText('Senha'), 'senha123');
        await user.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith({ email: 'cliente@teste.com', password: 'senha123' });
            expect(userService.getMe).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Bem-vindo de volta!');

            // Verifica o redirecionamento (neste caso, a rota mockada no useLocation)
            expect(mockNavigate).toHaveBeenCalledWith('/rota-protegida', { replace: true });
        });
    });

    it('deve fazer login como ADMIN e redirecionar para o painel administrativo', async () => {
        const user = userEvent.setup();

        mockSignIn.mockResolvedValueOnce({});

        // Simula o perfil retornando role 'admin'
        (userService.getMe as any).mockResolvedValueOnce({ role: 'admin', email: 'admin@licitadoc.com' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText('E-mail'), 'admin@licitadoc.com');
        await user.type(screen.getByLabelText('Senha'), 'admin123');
        await user.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

        await waitFor(() => {
            // Se for admin, a rota DEVE ser hardcoded para '/admin/dashboard'
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
        });
    });

    it('deve exibir toast de erro se as credenciais forem inválidas', async () => {
        const user = userEvent.setup();

        // Simula falha no login (ex: API retorna 401)
        mockSignIn.mockRejectedValueOnce(new Error('Unauthorized'));

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText('E-mail'), 'errado@teste.com');
        await user.type(screen.getByLabelText('Senha'), 'senhaErrada');
        await user.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas', expect.any(Object));
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});