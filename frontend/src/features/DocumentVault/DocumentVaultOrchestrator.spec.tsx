import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DocumentVaultOrchestrator } from './DocumentVaultOrchestrator';
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import { emissionRuleService } from '../../services/emissionRuleService';
import { toast } from 'sonner';

// Mocking services
vi.mock('../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
        update: vi.fn(),
    }
}));

vi.mock('../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        getTypes: vi.fn(),
        deleteDocument: vi.fn(),
        updateDocument: vi.fn(),
    }
}));

vi.mock('../../services/emissionRuleService', () => ({
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

const mockCompanies = [
    { id: 'comp-1', razao_social: 'Empresa Alfa', cnpj: '11.111.111/0001-11', pending_docs_notes: 'Notas antigas' },
    { id: 'comp-2', razao_social: 'Empresa Beta', cnpj: '22.222.222/0001-22' }
];

const mockDocuments = [
    { id: 'doc-1', title: 'Doc Oficial', filename: 'oficial.pdf', is_client_upload: false, status: 'valid', created_at: new Date().toISOString(), category_name: 'Fiscal' },
    { id: 'doc-2', title: 'Doc Cliente', filename: 'cliente.pdf', is_client_upload: true, status: 'valid', created_at: new Date().toISOString() }
];

describe('DocumentVaultOrchestrator Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getAll as any).mockResolvedValue(mockCompanies);
        (documentService.getTypes as any).mockResolvedValue([]);
        (emissionRuleService.resolveLink as any).mockResolvedValue(null);
        
        // Mock window.confirm
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    it('should load companies on mount', async () => {
        render(<DocumentVaultOrchestrator />);
        
        await waitFor(() => {
            expect(companyService.getAll).toHaveBeenCalled();
            expect(screen.getByText(/Empresa Alfa/i)).toBeInTheDocument();
            expect(screen.getByText(/Empresa Beta/i)).toBeInTheDocument();
        });
    });

    it('should show empty state when no company is selected', async () => {
        render(<DocumentVaultOrchestrator />);
        
        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        expect(screen.getByText('Nenhuma empresa selecionada')).toBeInTheDocument();
    });

    it('should load documents when a company is selected', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'comp-1' } });

        await waitFor(() => {
            expect(documentService.getAll).toHaveBeenCalledWith('comp-1');
            expect(screen.getByText('Doc Oficial')).toBeInTheDocument();
            expect(screen.getByText('Doc Cliente')).toBeInTheDocument();
            // Should also load pending notes
            expect(screen.getByDisplayValue('Notas antigas')).toBeInTheDocument();
        });
    });

    it('should toggle upload modal visibility', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        const uploadBtn = await screen.findByText('Novo Documento Oficial');
        fireEvent.click(uploadBtn);

        expect(screen.getByText('Centro de Upload Inteligente')).toBeInTheDocument();

        const closeBtn = screen.getByRole('button', { name: /Fechar/i });
        fireEvent.click(closeBtn);
        
        expect(screen.queryByText('Centro de Upload Inteligente')).not.toBeInTheDocument();
    });

    it('should toggle edit modal visibility', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        await waitFor(() => screen.getByText('Doc Oficial'));
        
        const editBtn = screen.getByTitle('Editar Documento');
        fireEvent.click(editBtn);

        expect(screen.getByText('Editar Documento')).toBeInTheDocument();

        const closeBtn = screen.getByRole('button', { name: /Fechar/i });
        fireEvent.click(closeBtn);
        
        expect(screen.queryByText('Editar Documento')).not.toBeInTheDocument();
    });

    it('should call deleteDocument when confirmed', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        await waitFor(() => screen.getByText('Doc Oficial'));
        
        const deleteBtn = screen.getByTitle('Excluir Definitivamente');
        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(documentService.deleteDocument).toHaveBeenCalledWith('doc-1');
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Documento excluído com sucesso!');
        });
    });

    it('should call updateDocument to archive when confirmed', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        await waitFor(() => screen.getByText('Doc Oficial'));
        
        const archiveBtn = screen.getByTitle('Armazenar');
        fireEvent.click(archiveBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(documentService.updateDocument).toHaveBeenCalledWith('doc-1', { status: 'archived' });
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Documento armazenado com sucesso!');
        });
    });

    it('should update pending notes', async () => {
        const user = userEvent.setup();
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => screen.getByText(/Empresa Alfa/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        const notesArea = await screen.findByDisplayValue('Notas antigas');
        await user.clear(notesArea);
        await user.type(notesArea, 'Novas notas de teste');

        const saveBtn = screen.getByText('Salvar Avisos');
        await user.click(saveBtn);

        await waitFor(() => {
            expect(companyService.update).toHaveBeenCalledWith('comp-1', { pending_docs_notes: 'Novas notas de teste' });
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('should show error toast if company loading fails', async () => {
        (companyService.getAll as any).mockRejectedValueOnce(new Error('Fail'));
        render(<DocumentVaultOrchestrator />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar lista de empresas.');
        });
    });

});
