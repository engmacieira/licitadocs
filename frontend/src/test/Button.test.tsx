import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Vamos testar um botão HTML simples por enquanto
describe('Componente de Teste Inicial', () => {
    it('deve renderizar um botão na tela', () => {
        render(<button>Clique aqui</button>);

        const button = screen.getByText('Clique aqui');

        expect(button).toBeInTheDocument();
    });
});