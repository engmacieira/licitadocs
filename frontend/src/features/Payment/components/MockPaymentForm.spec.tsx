import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MockPaymentForm } from './MockPaymentForm';

describe('MockPaymentForm Component', () => {
    const defaultProps = {
        responsibleName: 'John Doe',
        isProcessing: false,
        onPayment: vi.fn()
    };

    it('should render the form title', () => {
        render(<MockPaymentForm {...defaultProps} />);
        
        expect(screen.getByText('Dados de Pagamento')).toBeInTheDocument();
    });

    it('should display the responsible name in the card holder input', () => {
        render(<MockPaymentForm {...defaultProps} />);
        
        const cardHolderInput = screen.getByLabelText(/Nome no Cartão/i);
        expect(cardHolderInput).toHaveValue('JOHN DOE');
    });

    it('should use "SEU NOME" as fallback if responsibleName is empty', () => {
        render(<MockPaymentForm {...defaultProps} responsibleName="" />);
        
        const cardHolderInput = screen.getByLabelText(/Nome no Cartão/i);
        expect(cardHolderInput).toHaveValue('SEU NOME');
    });

    it('should render the simulation warning', () => {
        render(<MockPaymentForm {...defaultProps} />);
        
        expect(screen.getByText('Ambiente de Teste Seguro')).toBeInTheDocument();
        expect(screen.getByText(/Nenhum valor será cobrado/i)).toBeInTheDocument();
    });

    it('should call onPayment when the button is clicked', () => {
        render(<MockPaymentForm {...defaultProps} />);
        
        const paymentButton = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });
        fireEvent.click(paymentButton);
        
        expect(defaultProps.onPayment).toHaveBeenCalledTimes(1);
    });

    it('should show processing state on the button when isProcessing is true', () => {
        render(<MockPaymentForm {...defaultProps} isProcessing={true} />);
        
        // Button text should change to "Processando..."
        expect(screen.getByText('Processando...')).toBeInTheDocument();
        
        // The ArrowRight icon should not be present
        const button = screen.getByRole('button');
        // We can check if it has the loading class or if it's disabled if the Button component supports it
        // and we can check if it contains the "Processando..." text.
        expect(button).toHaveTextContent('Processando...');
    });
});
