import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';
import { RegularityAnalysis } from './RegularityAnalysis';

// Wrapper to provide react-hook-form context
const Wrapper = ({ children, defaultValues = { status: 'valid', notes: '' } }: any) => {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('RegularityAnalysis Component', () => {
    it('should render correctly with default valid status', () => {
        render(
            <Wrapper>
                <RegularityAnalysis />
            </Wrapper>
        );

        expect(screen.getByLabelText(/Status do Documento/i)).toHaveValue('valid');
        expect(screen.getByPlaceholderText(/Opcional: Ex: Autenticado/i)).toBeInTheDocument();
        // Label should not have asterisk (optional)
        expect(screen.getByText(/Observações/i)).toBeInTheDocument();
    });

    it('should change visual context when status is irregular', () => {
        render(
            <Wrapper defaultValues={{ status: 'irregular', notes: '' }}>
                <RegularityAnalysis />
            </Wrapper>
        );

        expect(screen.getByLabelText(/Status do Documento/i)).toHaveValue('irregular');
        expect(screen.getByPlaceholderText(/Obrigatório: Descreva o motivo/i)).toBeInTheDocument();
        // Label should have asterisk for required field
        expect(screen.getByText(/Observações \*/i)).toBeInTheDocument();
    });

    it('should change visual context when status is error', () => {
        render(
            <Wrapper defaultValues={{ status: 'error', notes: '' }}>
                <RegularityAnalysis />
            </Wrapper>
        );

        expect(screen.getByLabelText(/Status do Documento/i)).toHaveValue('error');
        expect(screen.getByPlaceholderText(/Obrigatório: Descreva o motivo/i)).toBeInTheDocument();
    });
});
