import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderSummary } from './OrderSummary';

describe('OrderSummary Component', () => {
    it('should render the order summary title and icon', () => {
        render(<OrderSummary />);
        
        expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
    });

    it('should render the plan details and base price', () => {
        render(<OrderSummary />);
        
        expect(screen.getByText('LicitaDoc Business')).toBeInTheDocument();
        expect(screen.getByText('Assinatura Anual')).toBeInTheDocument();
        expect(screen.getAllByText('R$ 178,80')).toHaveLength(2);
    });

    it('should render the discount information', () => {
        render(<OrderSummary />);
        
        expect(screen.getByText('Desconto (Lançamento)')).toBeInTheDocument();
        expect(screen.getByText('- R$ 178,80')).toBeInTheDocument();
    });

    it('should render the final total as R$ 0,00', () => {
        render(<OrderSummary />);
        
        expect(screen.getByText('Total a pagar hoje')).toBeInTheDocument();
        expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });

    it('should render the free trial notice', () => {
        render(<OrderSummary />);
        
        expect(screen.getByText(/O seu período de teste gratuito começa hoje/i)).toBeInTheDocument();
    });
});
