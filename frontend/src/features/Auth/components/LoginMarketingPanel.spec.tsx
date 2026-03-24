import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, describe } from 'vitest';
import { LoginMarketingPanel } from './LoginMarketingPanel';

describe('LoginMarketingPanel', () => {
    it('deve renderizar o componente corretamente', () => {
        render(<LoginMarketingPanel />);
        
        // Verifica se o título principal está presente
        expect(screen.getByText(/Muito mais que um/i)).toBeInTheDocument();
        expect(screen.getByText(/cofre digital/i)).toBeInTheDocument();
        
        // Verifica o texto de descrição
        expect(screen.getByText(/Esqueça os alertas que só te dão trabalho/i)).toBeInTheDocument();
    });

    it('deve exibir os elementos do card de simulação', () => {
        render(<LoginMarketingPanel />);
        
        // Verifica elementos do card simulado
        expect(screen.getByText('Status do CNPJ')).toBeInTheDocument();
        expect(screen.getByText('100% REGULAR')).toBeInTheDocument();
        expect(screen.getByText('CND Federal (Receita)')).toBeInTheDocument();
        expect(screen.getByText(/Renovada automaticamente hoje/i)).toBeInTheDocument();
    });

    it('deve ter a classe hidden em mobile e lg:flex em desktop', () => {
        const { container } = render(<LoginMarketingPanel />);
        const mainDiv = container.firstChild as HTMLElement;
        
        expect(mainDiv).toHaveClass('hidden');
        expect(mainDiv).toHaveClass('lg:flex');
    });
});
