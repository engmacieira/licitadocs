import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi } from 'vitest';
import { VaultEmptyState } from './VaultEmptyState';

describe('VaultEmptyState', () => {
    it('deve renderizar a mensagem padrão quando o termo de pesquisa está vazio', () => {
        render(<VaultEmptyState searchTerm="" onClearSearch={() => {}} />);

        expect(screen.getByText('Nenhum documento encontrado')).toBeInTheDocument();
        expect(screen.getByText(/Ainda não há certidões emitidas para sua empresa/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Limpar busca/ })).not.toBeInTheDocument();
    });

    it('deve exibir a mensagem de erro de busca quando um termo é fornecido', () => {
        render(<VaultEmptyState searchTerm="alvará" onClearSearch={() => {}} />);

        expect(screen.getByText('Nenhum documento encontrado')).toBeInTheDocument();
        expect(screen.getByText(/Não encontramos resultados para "alvará"/)).toBeInTheDocument();
    });

    it('deve exibir o botão "Limpar busca" apenas quando o termo não estiver vazio', () => {
        render(<VaultEmptyState searchTerm="certidão" onClearSearch={() => {}} />);

        expect(screen.getByRole('button', { name: /Limpar busca/ })).toBeInTheDocument();
    });

    it('deve chamar onClearSearch ao clicar no botão de limpar busca', async () => {
        const mockOnClearSearch = vi.fn();
        const user = userEvent.setup();

        render(<VaultEmptyState searchTerm="pesquisa" onClearSearch={mockOnClearSearch} />);

        const button = screen.getByRole('button', { name: /Limpar busca/ });
        await user.click(button);

        expect(mockOnClearSearch).toHaveBeenCalledTimes(1);
    });
});
