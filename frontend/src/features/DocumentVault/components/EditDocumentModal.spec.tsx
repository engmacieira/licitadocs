import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EditDocumentModal } from './EditDocumentModal';
import { documentService } from '../../../services/documentService';
import { emissionRuleService } from '../../../services/emissionRuleService';
import { toast } from 'sonner';

// Mocking services
vi.mock('../../../services/documentService', () => ({
    documentService: {
        updateDocument: vi.fn(),
    }
}));

vi.mock('../../../services/emissionRuleService', () => ({
    emissionRuleService: {
        resolveLink: vi.fn(),
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

const mockDocument = {
    id: 'doc-1',
    title: 'Certidão de Teste',
    filename: 'teste.pdf',
    status: 'valid',
    expiration_date: '2023-12-31T00:00:00Z',
    type_id: 'type-1',
    company_id: 'comp-123'
};

describe('EditDocumentModal Component', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        document: mockDocument as any,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (emissionRuleService.resolveLink as any).mockResolvedValue(null);
    });

    it('should not render when isOpen is false or document is null', () => {
        const { rerender } = render(<EditDocumentModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Editar Documento')).not.toBeInTheDocument();

        rerender(<EditDocumentModal {...defaultProps} document={null} />);
        expect(screen.queryByText('Editar Documento')).not.toBeInTheDocument();
    });

    it('should render correctly with document data', () => {
        render(<EditDocumentModal {...defaultProps} />);
        
        expect(screen.getByText('Editar Documento')).toBeInTheDocument();
        expect(screen.getByText('Certidão de Teste')).toBeInTheDocument();
        
        expect(screen.getByLabelText(/Nova Data de Validade/i)).toHaveValue('2023-12-31');
        expect(screen.getByLabelText(/Status do Documento/i)).toHaveValue('valid');
    });

    it('should show error toast if notes are missing for non-valid status', async () => {
        const user = userEvent.setup();
        render(<EditDocumentModal {...defaultProps} />);

        // Change status to irregular
        const statusSelect = screen.getByLabelText(/Status do Documento/i);
        await user.selectOptions(statusSelect, 'irregular');

        // Submit without notes
        const submitBtn = screen.getByRole('button', { name: /guardar alterações/i });
        await user.click(submitBtn);

        expect(toast.error).toHaveBeenCalledWith('Observação Obrigatória', expect.any(Object));
        expect(documentService.updateDocument).not.toHaveBeenCalled();
    });

    it('should successfully update the document', async () => {
        const user = userEvent.setup();
        (documentService.updateDocument as any).mockResolvedValue({});

        render(<EditDocumentModal {...defaultProps} />);

        // Change date
        const dateInput = screen.getByLabelText(/Nova Data de Validade/i);
        fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

        // Change auth code
        const authInput = screen.getByLabelText(/Novo Cód. Autenticação/i);
        await user.clear(authInput);
        await user.type(authInput, 'XYZ-789');

        // Submit
        const submitBtn = screen.getByRole('button', { name: /guardar alterações/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(documentService.updateDocument).toHaveBeenCalledWith('doc-1', {
                expiration_date: '2024-01-01',
                authentication_code: 'XYZ-789',
                status: 'valid',
                notes: undefined
            });
            expect(toast.success).toHaveBeenCalledWith('Documento atualizado com sucesso!');
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('should successfully update with irregular status and notes', async () => {
        const user = userEvent.setup();
        (documentService.updateDocument as any).mockResolvedValue({});

        render(<EditDocumentModal {...defaultProps} />);

        // Change status
        const statusSelect = screen.getByLabelText(/Status do Documento/i);
        fireEvent.change(statusSelect, { target: { value: 'error' } });

        // Add notes
        const notesTextArea = screen.getByLabelText(/Observações/i);
        await user.type(notesTextArea, 'Falha no site da prefeitura');

        // Submit
        const submitBtn = screen.getByRole('button', { name: /guardar alterações/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(documentService.updateDocument).toHaveBeenCalledWith('doc-1', expect.objectContaining({
                status: 'error',
                notes: 'Falha no site da prefeitura'
            }));
            expect(toast.success).toHaveBeenCalledWith('Documento atualizado com sucesso!');
        });
    });


    it('should call onClose when clicking cancel', () => {
        render(<EditDocumentModal {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
