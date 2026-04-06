import { render, screen } from '@testing-library/react';
import { expect, it, describe } from 'vitest';
import { LoginMarketingPanel } from './LoginMarketingPanel';

describe('LoginMarketingPanel', () => {
    it('deve renderizar o componente corretamente', () => {
        render(<LoginMarketingPanel />);

        // Verifica se o título principal está presente
        expect(screen.getByText(/Blindagem de Faturas/i)).toBeInTheDocument();

        // Verifica o texto de descrição
        expect(screen.getByText(/Fique tranquilo. Continuamos monitorando sua regularidade/i)).toBeInTheDocument();
    });

    it('deve exibir os elementos do card de simulação', () => {
        render(<LoginMarketingPanel />);

        // Verifica elementos do card simulado
        expect(screen.getByText('Diagnóstico do CNPJ')).toBeInTheDocument();
        expect(screen.getByText('100% BLINDADO')).toBeInTheDocument();
        expect(screen.getByText('Acervo de Habilitação')).toBeInTheDocument();
        expect(screen.getByText(/Padrão Lei 14.133\/21 validado/i)).toBeInTheDocument();
    });

    it('deve ter a classe hidden em mobile e lg:flex em desktop', () => {
        const { container } = render(<LoginMarketingPanel />);
        const mainDiv = container.firstChild as HTMLElement;

        expect(mainDiv).toHaveClass('hidden');
        expect(mainDiv).toHaveClass('lg:flex');
    });
});
