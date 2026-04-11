import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../index';
import api from '../../../services/api';

vi.mock('../../../services/api');

describe('ResetPasswordPage', () => {
    it('deve redirecionar para login se nao houver token na URL', () => {
        // Redireciona e retorna Navigate vazio visualmente
        render(
            <MemoryRouter initialEntries={['/reset-password']}>
                <ResetPasswordPage />
            </MemoryRouter>
        );
        // O componente renderiza Navigate to="/login" que retorna null no DOM atual
        expect(screen.queryByText(/Nova Senha/i)).not.toBeInTheDocument();
    });

    it('deve renderizar formulario se houver token', () => {
        render(
            <MemoryRouter initialEntries={['/reset-password?token=123456']}>
                <ResetPasswordPage />
            </MemoryRouter>
        );
        expect(screen.getByText(/Criar Nova Senha/i)).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText(/••••••••/i)).toHaveLength(2);
    });

    it('deve validar senhas que nao coincidem', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/reset-password?token=123456']}>
                <ResetPasswordPage />
            </MemoryRouter>
        );

        const inputs = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(inputs[0], 'Senh@Forte1');
        await user.type(inputs[1], 'Senh@Forte2');

        const submitButton = screen.getByRole('button', { name: /Redefinir Senha/i });
        await user.click(submitButton);

        expect(await screen.findByText(/As senhas não coincidem./i)).toBeInTheDocument();
    });

    it('deve redefinir senha com sucesso', async () => {
        const user = userEvent.setup();
        vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Senha atualizada' } });

        render(
            <MemoryRouter initialEntries={['/reset-password?token=123456']}>
                <ResetPasswordPage />
            </MemoryRouter>
        );

        const inputs = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(inputs[0], 'Senh@Forte1');
        await user.type(inputs[1], 'Senh@Forte1');

        const submitButton = screen.getByRole('button', { name: /Redefinir Senha/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
                token: '123456',
                new_password: 'Senh@Forte1'
            });
        });

        expect(await screen.findByText(/Tudo Certo!/i)).toBeInTheDocument();
    });
});
