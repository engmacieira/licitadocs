import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
    it('deve renderizar o input básico', () => {
        render(<Input placeholder="Digite seu nome" />);
        expect(screen.getByPlaceholderText('Digite seu nome')).toBeInTheDocument();
    });

    it('deve renderizar com label e focar ao clicar nela', async () => {
        const user = userEvent.setup();
        // É importante passar o 'id' para que a tag <label> se conecte ao <input>
        render(<Input label="Nome Completo" id="nome-id" />);

        // No mundo real, a acessibilidade (A11y) exige que inputs sejam encontrados pela sua Label
        const input = screen.getByLabelText('Nome Completo');
        expect(input).toBeInTheDocument();

        // Simula o clique na label e verifica se o input recebe o foco (focus)
        await user.click(screen.getByText('Nome Completo'));
        expect(input).toHaveFocus();
    });

    it('deve exibir mensagem de erro e aplicar borda vermelha', () => {
        render(<Input error="Este campo é obrigatório" data-testid="input-erro" />);

        // Verifica se a mensagem de erro apareceu no DOM
        expect(screen.getByText('Este campo é obrigatório')).toBeInTheDocument();
        // Verifica se a classe de erro do Tailwind foi aplicada ao input
        expect(screen.getByTestId('input-erro')).toHaveClass('border-red-500');
    });

    it('deve exibir texto de ajuda (helperText)', () => {
        render(<Input helperText="A senha deve ter 8 caracteres" />);
        expect(screen.getByText('A senha deve ter 8 caracteres')).toBeInTheDocument();
    });

    it('deve renderizar um ícone quando fornecido', () => {
        const FakeIcon = <span data-testid="meu-icone">Icone</span>;
        render(<Input icon={FakeIcon} />);

        expect(screen.getByTestId('meu-icone')).toBeInTheDocument();
        // Verifica se adicionou o 'pl-10' (padding left) para não sobrepor o texto ao ícone
        expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('deve permitir que o usuário digite valores', async () => {
        const user = userEvent.setup(); // Prepara o simulador de usuário
        render(<Input label="Email" id="email" />);

        const input = screen.getByLabelText('Email') as HTMLInputElement;

        // Simula a digitação real, tecla a tecla
        await user.type(input, 'licitadocs@teste.com');

        expect(input.value).toBe('licitadocs@teste.com');
    });

    it('deve bloquear digitação quando estiver disabled', () => {
        render(<Input placeholder="Bloqueado" disabled />);
        const input = screen.getByPlaceholderText('Bloqueado');

        expect(input).toBeDisabled();
    });
});