import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './index';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE SERVIÇOS
// ==========================================
vi.mock('../../services/authService', () => ({
    authService: { register: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ signIn: vi.fn() }),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('RegisterPage Resilience Stress Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve recuperar a interface e manter os dados após falha de rede no passo 4', async () => {
        const user = userEvent.setup();

        // 🛑 ESTRESSE: Simulamos falha catastrófica da API na hora de finalizar
        (authService.register as any).mockRejectedValueOnce(new Error('Network Error'));

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        // --- PREENCHENDO O FORMULÁRIO (Modo Rápido) ---
        // Passo 1
        await user.type(screen.getByLabelText(/CNPJ/i), '12345678000190');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Empresa Sem Internet LTDA');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Passo 2
        await waitFor(() => expect(screen.getByText(/Passo 2 de 4/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/Nome Completo/i), 'João Testador');
        await user.type(screen.getByLabelText(/CPF/i), '12345678901');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Passo 3
        await waitFor(() => expect(screen.getByText(/Passo 3 de 4/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/E-mail/i), 'joao@offline.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), 'senha123');
        await user.type(screen.getByLabelText(/Confirmar/i), 'senha123');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Passo 4 (Upload e Envio)
        await waitFor(() => expect(screen.getByText(/Passo 4 de 4/i)).toBeInTheDocument());
        const file = new File(['dummy content'], 'documento.pdf', { type: 'application/pdf' });
        const inputs = screen.getAllByLabelText(/Clique para anexar arquivo/i);
        for (const input of inputs) {
            await user.upload(input, file);
        }

        const submitBtn = screen.getByRole('button', { name: /Finalizar Cadastro/i });
        await user.click(submitBtn);

        // 🔍 ASSERT: Verifica a resiliência do sistema
        await waitFor(() => {
            // 1. O utilizador deve ser avisado do erro
            expect(toast.error).toHaveBeenCalled();

            // 2. O botão NÃO deve ficar travado em 'loading' (isSubmitting = false)
            expect(submitBtn).not.toBeDisabled();

            // 3. O utilizador NÃO deve ser redirecionado (mockNavigate não é chamado)
            expect(mockNavigate).not.toHaveBeenCalled();

            // 4. Mais importante: Ele DEVE continuar no Passo 4 para poder tentar de novo!
            expect(screen.getByText(/Passo 4 de 4/i)).toBeInTheDocument();
        });
    });
});