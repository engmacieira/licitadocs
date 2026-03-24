import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SignatureUpload } from './SignatureUpload';
import userEvent from '@testing-library/user-event';

describe('SignatureUpload', () => {
    afterEach(cleanup);
    
    const mockSetContractFile = vi.fn();
    const mockSetProxyFile = vi.fn();
    const mockHandleComplete = vi.fn();

    const defaultProps = {
        contractFile: null,
        setContractFile: mockSetContractFile,
        proxyFile: null,
        setProxyFile: mockSetProxyFile,
        handleComplete: mockHandleComplete,
        isLoading: false,
    };

    it('should render correctly in initial state (no files)', () => {
        render(<SignatureUpload {...defaultProps} />);
        
        expect(screen.getByText(/Anexar Documentos Assinados/i)).toBeInTheDocument();
        expect(screen.getByText(/Contrato SaaS Assinado/i)).toBeInTheDocument();
        expect(screen.getByText(/Procuração Assinada/i)).toBeInTheDocument();
        
        // Two upload zones showing "Clique para procurar"
        const uploadLabels = screen.getAllByText(/Clique para procurar o PDF assinado/i);
        expect(uploadLabels).toHaveLength(2);
        
        // Finalize button should be disabled
        const finalizeButton = screen.getByRole('button', { name: /Finalizar e Enviar/i });
        expect(finalizeButton).toBeDisabled();
    });

    it('should show file name and remove button when a file is provided', () => {
        const contractFile = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
        render(<SignatureUpload {...defaultProps} contractFile={contractFile} />);
        
        expect(screen.getByText('contract.pdf')).toBeInTheDocument();
        
        // Remove button for contract
        const removeButtons = screen.getAllByRole('button');
        // Finalize button + 1 remove button
        expect(removeButtons).toHaveLength(2);
    });

    it('should call setContractFile when a file is selected', async () => {
        const { container } = render(<SignatureUpload {...defaultProps} />);
        
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        
        // Find input by ID since the label is not associated via htmlFor
        const contractInput = container.querySelector('#contract-upload') as HTMLInputElement;
        
        // Use fireEvent for hidden inputs as userEvent.upload might check for visibility
        fireEvent.change(contractInput, { target: { files: [file] } });
        
        expect(mockSetContractFile).toHaveBeenCalledWith(file);
    });

    it('should call setFile(null) when remove button is clicked', async () => {
        const user = userEvent.setup();
        const contractFile = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
        render(<SignatureUpload {...defaultProps} contractFile={contractFile} />);
        
        // The remove button has an X icon. Let's find it by the button's class or better by adding a title or just finding the one that is NOT the main button.
        const buttons = screen.getAllByRole('button');
        const removeBtn = buttons.find(btn => btn.querySelector('svg.lucide-x'));
        
        expect(removeBtn).toBeInTheDocument();
        await user.click(removeBtn!);
        expect(mockSetContractFile).toHaveBeenCalledWith(null);
    });

    it('should enable Finalize button only when both files are provided', () => {
        const contractFile = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
        const proxyFile = new File(['world'], 'proxy.pdf', { type: 'application/pdf' });
        
        const { rerender } = render(<SignatureUpload {...defaultProps} contractFile={contractFile} />);
        expect(screen.getByRole('button', { name: /Finalizar e Enviar/i })).toBeDisabled();
        
        rerender(<SignatureUpload {...defaultProps} contractFile={contractFile} proxyFile={proxyFile} />);
        expect(screen.getByRole('button', { name: /Finalizar e Enviar/i })).not.toBeDisabled();
    });

    it('should call handleComplete when Finalize button is clicked', async () => {
        const user = userEvent.setup();
        const contractFile = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
        const proxyFile = new File(['world'], 'proxy.pdf', { type: 'application/pdf' });
        
        render(<SignatureUpload {...defaultProps} contractFile={contractFile} proxyFile={proxyFile} />);
        
        const finalizeButton = screen.getByRole('button', { name: /Finalizar e Enviar/i });
        await user.click(finalizeButton);
        
        expect(mockHandleComplete).toHaveBeenCalled();
    });

    it('should show loading state when isLoading is true', () => {
        const contractFile = new File(['hello'], 'contract.pdf', { type: 'application/pdf' });
        const proxyFile = new File(['world'], 'proxy.pdf', { type: 'application/pdf' });
        
        render(<SignatureUpload {...defaultProps} contractFile={contractFile} proxyFile={proxyFile} isLoading={true} />);
        
        const finalizeButton = screen.getByRole('button', { name: /Finalizar e Enviar/i });
        // Our Button component usually shows a spinner or changes text when isLoading is true
        // and it should be disabled
        expect(finalizeButton).toBeDisabled();
    });
});
