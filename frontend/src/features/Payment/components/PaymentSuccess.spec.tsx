import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PaymentSuccess } from './PaymentSuccess';

describe('PaymentSuccess Component', () => {
    const defaultProps = {
        legalName: 'Empresa Teste LTDA'
    };

    it('should render the success message "Tudo Pronto!"', () => {
        render(<PaymentSuccess {...defaultProps} />);
        
        expect(screen.getByText('Tudo Pronto!')).toBeInTheDocument();
    });

    it('should display the legal name of the company', () => {
        render(<PaymentSuccess {...defaultProps} />);
        
        expect(screen.getByText(defaultProps.legalName)).toBeInTheDocument();
        expect(screen.getByText(/O pagamento foi confirmado e a conta da empresa/i)).toBeInTheDocument();
    });

    it('should render the "Acessando seu Dashboard..." message', () => {
        render(<PaymentSuccess {...defaultProps} />);
        
        expect(screen.getByText('Acessando seu Dashboard...')).toBeInTheDocument();
    });

    it('should render a progress bar', () => {
        const { container } = render(<PaymentSuccess {...defaultProps} />);
        
        // The progress bar is a div with animate-pulse and bg-green-500
        const progressBar = container.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveClass('animate-pulse');
    });
});
