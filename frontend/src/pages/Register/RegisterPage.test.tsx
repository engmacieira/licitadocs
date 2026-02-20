import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './index';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE SERVIÇOS E CONTEXTO
// ==========================================
vi.mock('../../services/authService', () => ({
    authService: {
        register: vi.fn(),
    },
}));

const mockSignIn = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
    }),
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
    };
});

describe('RegisterPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve completar o fluxo de registro de 4 passos com sucesso', async () => {
        const user = userEvent.setup();
        (authService.register as any).mockResolvedValueOnce({});
        mockSignIn.mockResolvedValueOnce({});

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        // --- PASSO 1: Empresa ---
        expect(screen.getByText(/Passo 1 de 4/i)).toBeInTheDocument();
        await user.type(screen.getByLabelText(/CNPJ/i), '12345678000190');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Minha Empresa LTDA');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // --- PASSO 2: Responsável ---
        await waitFor(() => expect(screen.getByText(/Passo 2 de 4/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/Nome Completo/i), 'João Testador');
        await user.type(screen.getByLabelText(/CPF/i), '12345678901');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // --- PASSO 3: Credenciais ---
        await waitFor(() => expect(screen.getByText(/Passo 3 de 4/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'joao@empresa.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), 'senha123');
        await user.type(screen.getByLabelText(/Confirmar Senha/i), 'senha123');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // --- PASSO 4: Documentos ---
        await waitFor(() => expect(screen.getByText(/Passo 4 de 4/i)).toBeInTheDocument());

        // Simula upload dos 3 documentos obrigatórios
        const file = new File(['hello'], 'documento.pdf', { type: 'application/pdf' });
        const inputs = screen.getAllByLabelText(/Clique para anexar arquivo/i);

        for (const input of inputs) {
            await user.upload(input, file);
        }

        // Finalizar Cadastro
        await user.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));

        // Validações finais
        await waitFor(() => {
            // Verifica se o serviço de registro foi chamado com FormData
            expect(authService.register).toHaveBeenCalled();

            // Verifica se o auto-login foi disparado
            expect(mockSignIn).toHaveBeenCalledWith({
                email: 'joao@empresa.com',
                password: 'senha123'
            });

            // Verifica redirecionamento para o contrato
            expect(mockNavigate).toHaveBeenCalledWith('/contract-sign', { replace: true });
            expect(toast.success).toHaveBeenCalledWith("Cadastro realizado!", expect.any(Object));
        });
    });

    it('deve exibir erro se tentar finalizar sem anexar todos os documentos', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        // Pula direto para o passo 4 para o teste de validação (simulação rápida)
        // Nota: Em um teste real, você precisaria passar pelos passos ou mockar o estado inicial
        // Aqui vamos apenas garantir que a lógica de documentos vazios dispara o toast

        // Vamos preencher o necessário para chegar ao passo 4
        await user.type(screen.getByLabelText(/CNPJ/i), '12345678000190');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Empresa X');
        await user.click(screen.getByRole('button', { name: /Próximo/i })); // P1 -> P2

        await user.type(screen.getByLabelText(/Nome Completo/i), 'João');
        await user.type(screen.getByLabelText(/CPF/i), '12345678901');
        await user.click(screen.getByRole('button', { name: /Próximo/i })); // P2 -> P3

        await user.type(screen.getByLabelText(/E-mail/i), 'teste@teste.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), '123456');
        await user.type(screen.getByLabelText(/Confirmar/i), '123456');
        await user.click(screen.getByRole('button', { name: /Próximo/i })); // P3 -> P4

        // Tenta finalizar sem arquivos
        await user.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));

        expect(toast.error).toHaveBeenCalledWith("Por favor, anexe todos os documentos obrigatórios.");
    });
});