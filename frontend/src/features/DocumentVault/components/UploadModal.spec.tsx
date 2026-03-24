import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UploadModal } from './UploadModal';
import { documentService } from '../../../services/documentService';
import { emissionRuleService } from '../../../services/emissionRuleService';
import { toast } from 'sonner';

// Mocking services
vi.mock('../../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
        upload: vi.fn(),
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
        info: vi.fn(),
    }
}));

const mockCategories = [
    {
        id: 'cat-1',
        name: 'Fiscal',
        types: [
            { id: 'type-1', name: 'CND Federal', validity_days_default: 60 },
            { id: 'type-2', name: 'CND Municipal', validity_days_default: 0 }
        ]
    }
];

describe('UploadModal Component', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        targetCompanyId: 'comp-123',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (documentService.getTypes as any).mockResolvedValue(mockCategories);
        (emissionRuleService.resolveLink as any).mockResolvedValue(null);
    });

    it('should not render when isOpen is false', () => {
        render(<UploadModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Centro de Upload Inteligente')).not.toBeInTheDocument();
    });

    it('should render correctly and load document types', async () => {
        render(<UploadModal {...defaultProps} />);
        
        expect(screen.getByText('Centro de Upload Inteligente')).toBeInTheDocument();
        expect(documentService.getTypes).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('CND Federal')).toBeInTheDocument();
            expect(screen.getByText('CND Municipal')).toBeInTheDocument();
        });
    });

    it('should show error toast if file is missing for valid status', async () => {
        const user = userEvent.setup();
        render(<UploadModal {...defaultProps} />);

        await waitFor(() => screen.getByText('CND Federal'));

        // Select type
        const typeSelect = screen.getByLabelText(/tipo de documento/i);
        await user.selectOptions(typeSelect, 'type-1');

        // Submit without file
        const submitBtn = screen.getByRole('button', { name: /enviar para o cofre/i });
        await user.click(submitBtn);

        expect(toast.error).toHaveBeenCalledWith('Anexo Obrigatório', expect.any(Object));
        expect(documentService.upload).not.toHaveBeenCalled();
    });

    it('should show error toast if notes are missing for irregular status', async () => {
        const user = userEvent.setup();
        render(<UploadModal {...defaultProps} />);

        await waitFor(() => screen.getByText('CND Federal'));

        // Select status irregular
        const statusSelect = screen.getByLabelText(/status do documento/i);
        await user.selectOptions(statusSelect, 'irregular');

        // Submit without notes
        const submitBtn = screen.getByRole('button', { name: /salvar registo de pendência/i });
        await user.click(submitBtn);

        expect(toast.error).toHaveBeenCalledWith('Observação Obrigatória', expect.any(Object));
        expect(documentService.upload).not.toHaveBeenCalled();
    });

    it('should successfully upload a file when valid', async () => {
        const user = userEvent.setup();
        (documentService.upload as any).mockResolvedValue({ id: 'doc-1' });

        render(<UploadModal {...defaultProps} />);

        await waitFor(() => screen.getByText('CND Federal'));

        // Select type
        const typeSelect = screen.getByLabelText(/tipo de documento/i);
        await user.selectOptions(typeSelect, 'type-1');

        // Add file
        const file = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
        const input = screen.getByLabelText(/arquivo pdf/i) as HTMLInputElement;
        await user.upload(input, file);

        // Submit
        const submitBtn = screen.getByRole('button', { name: /enviar para o cofre/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(documentService.upload).toHaveBeenCalledWith(
                expect.any(File),
                'comp-123',
                expect.objectContaining({
                    typeId: 'type-1',
                    status: 'valid'
                })
            );
            expect(toast.success).toHaveBeenCalledWith('Documento enviado com sucesso!');
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('should successfully save a pendency when irregular with notes', async () => {
        const user = userEvent.setup();
        (documentService.upload as any).mockResolvedValue({ id: 'doc-1' });

        render(<UploadModal {...defaultProps} />);

        await waitFor(() => screen.getByText('CND Federal'));

        // Select type
        const typeSelect = screen.getByLabelText(/tipo de documento/i);
        await user.selectOptions(typeSelect, 'type-2');

        // Select status irregular
        const statusSelect = screen.getByLabelText(/status do documento/i);
        await user.selectOptions(statusSelect, 'irregular');

        // Add notes
        const notes = screen.getByPlaceholderText(/obrigatório: descreva o motivo/i);
        await user.type(notes, 'Documento vencido no portal');

        // Submit
        const submitBtn = screen.getByRole('button', { name: /salvar registo de pendência/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(documentService.upload).toHaveBeenCalledWith(
                null,
                'comp-123',
                expect.objectContaining({
                    typeId: 'type-2',
                    status: 'irregular',
                    notes: 'Documento vencido no portal'
                })
            );
            expect(toast.success).toHaveBeenCalledWith('Aviso de pendência registado no cofre!');
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });



    it('should call onClose when clicking cancel', () => {
        render(<UploadModal {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
