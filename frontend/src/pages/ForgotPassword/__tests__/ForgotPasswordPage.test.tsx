import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../index';
import api from '../../../services/api';

vi.mock('../../../services/api');

describe('ForgotPasswordPage', () => {
    it('deve renderizar a tela de esqueci a senha', () => {
        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );
        expect(screen.getByText(/Esqueceu a senha\?/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/seu@email.com.br/i)).toBeInTheDocument();
    });

    it('deve enviar o formulario e exibir sucesso', async () => {
        const user = userEvent.setup();
        vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Instruções enviadas para o seu e-mail.' } });

        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText(/seu@email.com.br/i);
        await user.type(emailInput, 'teste@empresa.com');

        const submitButton = screen.getByRole('button', { name: /Enviar link de recuperação/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'teste@empresa.com' });
        });

        // Updated success screen title in component is "Solicitação Recebida"
        expect(await screen.findByText(/Solicitação Recebida/i)).toBeInTheDocument();
        expect(screen.getByText(/Instruções enviadas para o seu e-mail./i)).toBeInTheDocument();
    });

    it('deve exibir sucesso mesmo se a API retornar falha (anti-enumeração)', async () => {
        const user = userEvent.setup();
        vi.mocked(api.post).mockRejectedValueOnce({
            response: { data: { detail: 'Erro interno' } }
        });

        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText(/seu@email.com.br/i);
        await user.type(emailInput, 'teste@empresa.com');

        const submitButton = screen.getByRole('button', { name: /Enviar link de recuperação/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Solicitação Recebida/i)).toBeInTheDocument();
        });
    });
});
