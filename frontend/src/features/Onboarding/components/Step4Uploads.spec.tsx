import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Step4Uploads } from './Step4Uploads';
import userEvent from '@testing-library/user-event';

describe('Step4Uploads', () => {
    const mockSetFiles = {
        setSocialContract: vi.fn(),
        setCnpjCard: vi.fn(),
        setResponsibleDoc: vi.fn(),
        setProxyDoc: vi.fn(),
    };

    const defaultProps = {
        setStep: vi.fn(),
        isLoading: false,
        files: {
            socialContract: null,
            cnpjCard: null,
            responsibleDoc: null,
            proxyDoc: null,
        },
        setFiles: mockSetFiles,
    };

    it('renders all file upload fields', () => {
        render(<Step4Uploads {...defaultProps} />);
        
        expect(screen.getByText(/Contrato Social Atualizado/i)).toBeInTheDocument();
        expect(screen.getByText(/Cartão CNPJ/i)).toBeInTheDocument();
        expect(screen.getByText(/Documento com Foto/i)).toBeInTheDocument();
        expect(screen.getByText(/Procuração \(Opcional\)/i)).toBeInTheDocument();
    });

    it('calls setFiles when a file is selected', async () => {
        render(<Step4Uploads {...defaultProps} />);
        
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        // The inputs are hidden, but we can find them by id
        const input = document.getElementById('social') as HTMLInputElement;
        
        await userEvent.upload(input, file);
        
        expect(mockSetFiles.setSocialContract).toHaveBeenCalledWith(file);
    });

    it('shows file name and remove button when file is present', async () => {
        const propsWithFile = {
            ...defaultProps,
            files: {
                ...defaultProps.files,
                socialContract: new File([''], 'test-contract.pdf')
            }
        };
        
        render(<Step4Uploads {...propsWithFile} />);
        
        expect(screen.getByText('test-contract.pdf')).toBeInTheDocument();
        const removeBtn = screen.getByLabelText(/Remover ficheiro/i);
        expect(removeBtn).toBeInTheDocument();
        
        await userEvent.click(removeBtn);
        expect(mockSetFiles.setSocialContract).toHaveBeenCalledWith(null);
    });

    it('disables buttons when loading', () => {
        render(<Step4Uploads {...defaultProps} isLoading={true} />);
        
        expect(screen.getByRole('button', { name: /Finalizar Cadastro/i })).toBeDisabled();
        const backBtn = screen.getAllByRole('button')[0];
        expect(backBtn).toBeDisabled();
    });

    it('calls setStep(3) when clicking the back button', async () => {
        render(<Step4Uploads {...defaultProps} />);
        
        const backBtn = screen.getAllByRole('button')[0];
        await userEvent.click(backBtn);
        
        expect(defaultProps.setStep).toHaveBeenCalledWith(3);
    });
});
