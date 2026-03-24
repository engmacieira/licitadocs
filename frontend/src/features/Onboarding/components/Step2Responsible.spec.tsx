import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step2Responsible } from './Step2Responsible';
import userEvent from '@testing-library/user-event';

describe('Step2Responsible', () => {
    const defaultProps = {
        register: vi.fn().mockReturnValue({}),
        errors: {},
        handleCpfChange: vi.fn(),
        nextStep: vi.fn(),
        setStep: vi.fn(),
    };

    it('renders all fields and helper text correctly', () => {
        render(<Step2Responsible {...defaultProps} />);
        
        expect(screen.getByText(/Precisamos dos dados do responsável legal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
    });

    it('calls handleCpfChange when typing in CPF field', async () => {
        const user = userEvent.setup();
        render(<Step2Responsible {...defaultProps} />);
        
        const cpfInput = screen.getByLabelText(/CPF/i);
        await user.type(cpfInput, '12');
        
        expect(defaultProps.handleCpfChange).toHaveBeenCalled();
    });

    it('calls nextStep when clicking the submit button', async () => {
        const user = userEvent.setup();
        render(<Step2Responsible {...defaultProps} />);
        
        const nextBtn = screen.getByRole('button', { name: /Próximo/i });
        await user.click(nextBtn);
        
        expect(defaultProps.nextStep).toHaveBeenCalled();
    });

    it('calls setStep(1) when clicking the back button', async () => {
        const user = userEvent.setup();
        render(<Step2Responsible {...defaultProps} />);
        
        // The back button has ArrowLeft icon and variant="outline"
        const backBtn = screen.getAllByRole('button')[0]; // First button is back
        await user.click(backBtn);
        
        expect(defaultProps.setStep).toHaveBeenCalledWith(1);
    });

    it('displays validation errors', () => {
        const propsWithErrors = {
            ...defaultProps,
            errors: {
                responsibleName: { message: 'Nome inválido' },
                cpf: { message: 'CPF inválido' }
            }
        };
        
        render(<Step2Responsible {...propsWithErrors} />);
        
        expect(screen.getByText('Nome inválido')).toBeInTheDocument();
        expect(screen.getByText('CPF inválido')).toBeInTheDocument();
    });
});
