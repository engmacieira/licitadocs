import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CompanyVault } from './CompanyVault';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// Mocking services
vi.mock('../../../services/documentService', () => ({
    documentService: {
        downloadDocument: vi.fn(),
    }
}));

vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

const mockDocuments = [
    {
        id: 'doc-1',
        title: 'Certidão Federal',
        filename: 'federal.pdf',
        status: 'valid',
        created_at: '2023-11-01T10:00:00Z',
        category_name: 'Fiscal'
    },
    {
        id: 'doc-2',
        title: 'Certidão Estadual',
        filename: 'estadual.pdf',
        status: 'warning',
        expiration_date: '2023-12-31T00:00:00Z',
        created_at: '2023-11-02T10:00:00Z',
        category_name: 'Fiscal'
    },
    {
        id: 'doc-3',
        title: 'Antigo FGTS',
        filename: 'fgts_old.pdf',
        status: 'archived',
        created_at: '2022-01-01T10:00:00Z',
        category_name: 'Trabalhista'
    }
];

describe('CompanyVault Component', () => {
    const defaultProps = {
        documents: mockDocuments as any,
        onEditClick: vi.fn(),
        onDeleteClick: vi.fn(),
        onArchiveClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show empty state when no documents are provided', () => {
        render(<CompanyVault documents={[]} />);
        expect(screen.getByText('Nenhum documento encontrado neste cofre.')).toBeInTheDocument();
    });

    it('should render document categories and vigentes documents', () => {
        render(<CompanyVault {...defaultProps} />);

        expect(screen.getByText('Fiscal')).toBeInTheDocument();
        expect(screen.getByText('Trabalhista')).toBeInTheDocument();

        expect(screen.getByText('Certidão Federal')).toBeInTheDocument();
        expect(screen.getByText('Certidão Estadual')).toBeInTheDocument();

        // doc-3 is archived, should not be visible initially
        expect(screen.queryByText('Antigo FGTS')).not.toBeInTheDocument();
    });

    it('should show archived documents when expansion button is clicked', () => {
        render(<CompanyVault {...defaultProps} />);

        const historyBtn = screen.getByText(/Ver Armazenados/i);
        fireEvent.click(historyBtn);

        expect(screen.getByText('Antigo FGTS')).toBeInTheDocument();
    });

    it('should call onEditClick when edit button is clicked', () => {
        render(<CompanyVault {...defaultProps} />);

        const editButtons = screen.getAllByTitle('Editar Documento');
        fireEvent.click(editButtons[0]);

        expect(defaultProps.onEditClick).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('should call onDeleteClick when delete button is clicked', () => {
        render(<CompanyVault {...defaultProps} />);

        const deleteButtons = screen.getAllByTitle('Excluir Definitivamente');
        fireEvent.click(deleteButtons[0]);

        expect(defaultProps.onDeleteClick).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('should call onArchiveClick when archive button is clicked', () => {
        render(<CompanyVault {...defaultProps} />);

        const archiveButtons = screen.getAllByTitle('Armazenar');
        fireEvent.click(archiveButtons[0]);

        expect(defaultProps.onArchiveClick).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('should call downloadDocument when download button is clicked', async () => {
        (documentService.downloadDocument as any).mockResolvedValue({});
        render(<CompanyVault {...defaultProps} />);

        const downloadButtons = screen.getAllByTitle('Baixar Arquivo');
        fireEvent.click(downloadButtons[0]);

        expect(toast.info).toHaveBeenCalledWith('Iniciando download...');
        expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-1', 'federal.pdf');
    });

    it('should toggle section visibility when clicking the header', () => {
        render(<CompanyVault {...defaultProps} />);

        const sectionHeader = screen.getByText('Fiscal');
        fireEvent.click(sectionHeader);

        // After toggle, documents in 'Fiscal' section should be hidden
        expect(screen.queryByText('Certidão Federal')).not.toBeInTheDocument();

        fireEvent.click(sectionHeader);
        expect(screen.getByText('Certidão Federal')).toBeInTheDocument();
    });
});
