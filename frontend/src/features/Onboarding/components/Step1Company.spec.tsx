import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step1Company } from './Step1Company';
import userEvent from '@testing-library/user-event';

describe('Step1Company', () => {
    const defaultProps = {
        register: vi.fn().mockReturnValue({}),
        errors: {},
        handleCnpjChange: vi.fn(),
        nextStep: vi.fn(),
    };

    it('renders all fields correctly', () => {
        render(<Step1Company {...defaultProps} />);
        
        expect(screen.getByLabelText(/CNPJ/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nome Fantasia/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Próximo/i })).toBeInTheDocument();
    });

    it('calls handleCnpjChange when typing in CNPJ field', async () => {
        const user = userEvent.setup();
        render(<Step1Company {...defaultProps} />);
        
        const cnpjInput = screen.getByLabelText(/CNPJ/i);
        await user.type(cnpjInput, '12');
        
        expect(defaultProps.handleCnpjChange).toHaveBeenCalled();
    });

    it('calls nextStep when clicking the button', async () => {
        const user = userEvent.setup();
        render(<Step1Company {...defaultProps} />);
        
        const nextBtn = screen.getByRole('button', { name: /Próximo/i });
        await user.click(nextBtn);
        
        expect(defaultProps.nextStep).toHaveBeenCalled();
    });

    it('displays validation errors', () => {
        const propsWithErrors = {
            ...defaultProps,
            errors: {
                cnpj: { message: 'CNPJ inválido' },
                legalName: { message: 'Razão Social obrigatória' }
            }
        };
        
        render(<Step1Company {...propsWithErrors} />);
        
        expect(screen.getByText('CNPJ inválido')).toBeInTheDocument();
        expect(screen.getByText('Razão Social obrigatória')).toBeInTheDocument();
    });
});
