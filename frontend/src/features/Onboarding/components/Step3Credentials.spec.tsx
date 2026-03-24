import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step3Credentials } from './Step3Credentials';
import userEvent from '@testing-library/user-event';

describe('Step3Credentials', () => {
    const defaultProps = {
        register: vi.fn().mockReturnValue({}),
        errors: {},
        nextStep: vi.fn(),
        setStep: vi.fn(),
    };

    it('renders all credentials fields correctly', () => {
        render(<Step3Credentials {...defaultProps} />);
        
        expect(screen.getByLabelText(/E-mail Corporativo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Criar Senha/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument();
    });

    it('calls nextStep when clicking the next button', async () => {
        const user = userEvent.setup();
        render(<Step3Credentials {...defaultProps} />);
        
        const nextBtn = screen.getByRole('button', { name: /Próximo/i });
        await user.click(nextBtn);
        
        expect(defaultProps.nextStep).toHaveBeenCalled();
    });

    it('calls setStep(2) when clicking the back button', async () => {
        const user = userEvent.setup();
        render(<Step3Credentials {...defaultProps} />);
        
        const backBtn = screen.getAllByRole('button')[0];
        await user.click(backBtn);
        
        expect(defaultProps.setStep).toHaveBeenCalledWith(2);
    });

    it('displays validation errors', () => {
        const propsWithErrors = {
            ...defaultProps,
            errors: {
                email: { message: 'E-mail inválido' },
                password: { message: 'Senha curta' }
            }
        };
        
        render(<Step3Credentials {...propsWithErrors} />);
        
        expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
        expect(screen.getByText('Senha curta')).toBeInTheDocument();
    });
});
