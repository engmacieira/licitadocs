import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCompanyModal } from './CreateCompanyModal';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE REDE
// ==========================================
vi.mock('../../../services/companyService', () => ({
    companyService: { create: vi.fn(), update: vi.fn() }
}));
vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

describe('CreateCompanyModal Resilience Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve recuperar a interface após falha total de rede (Offline) no envio', async () => {
        const user = userEvent.setup();
        const onCloseMock = vi.fn();
        const onSuccessMock = vi.fn();

        // 🛑 ESTRESSE: Simulamos que o cabo de rede foi puxado (Erro de Conexão)
        (companyService.create as any).mockRejectedValueOnce(new Error('Network Error'));

        render(
            <CreateCompanyModal
                isOpen={true}
                onClose={onCloseMock}
                onSuccess={onSuccessMock}
            />
        );

        // Preenche os dados usando as labels exatas do seu componente
        await user.type(screen.getByLabelText(/CNPJ/i), '11111111000111');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Empresa Sem Internet Ltda');

        // Busca o botão com o texto exato que você usou no modo de Criação
        const submitBtn = screen.getByRole('button', { name: /Cadastrar Empresa/i });

        // Clica para enviar
        await user.click(submitBtn);

        // 🔍 ASSERT: Verifica se o sistema sobreviveu à queda
        await waitFor(() => {
            // 1. O sistema deve ter avisado o utilizador (Toast de erro foi chamado no catch)
            expect(toast.error).toHaveBeenCalled();

            // 2. O botão NÃO deve estar desabilitado (o React Hook Form volta isSubmitting para false)
            expect(submitBtn).not.toBeDisabled();

            // 3. O modal NÃO deve ter fechado (o onClose está dentro do try, logo não executa no catch)
            expect(onCloseMock).not.toHaveBeenCalled();
            expect(onSuccessMock).not.toHaveBeenCalled();
        });
    });
});