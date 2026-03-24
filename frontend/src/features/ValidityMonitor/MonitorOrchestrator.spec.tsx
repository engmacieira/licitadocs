import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorOrchestrator } from './MonitorOrchestrator';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

// Mock do serviço e do toast
vi.mock('../../services/documentService', () => ({
    documentService: {
        getExpiring: vi.fn(),
        getIrregular: vi.fn(),
        downloadDocument: vi.fn()
    }
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

const mockExpiring = [
    { id: 'exp-1', title: 'Vencimento 1', company_name: 'Empresa A', filename: 'venc1.pdf', expiration_date: '2026-10-20T12:00:00Z', is_structured: true, status: 'valid' }
];

const mockIrregular = [
    { id: 'irr-1', title: 'Irregular 1', company_name: 'Empresa B', company_id: 'b-1', filename: 'irr1.pdf', is_structured: true, status: 'irregular' }
];

describe('MonitorOrchestrator Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (documentService.getExpiring as any).mockResolvedValue(mockExpiring);
        (documentService.getIrregular as any).mockResolvedValue(mockIrregular);
    });

    it('should show loading state and then render initial data', async () => {
        render(<MonitorOrchestrator />);
        
        expect(screen.getByText('A atualizar monitor...')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Empresa B')).toBeInTheDocument();
        expect(screen.getByText('Irregular 1')).toBeInTheDocument();
        expect(documentService.getExpiring).toHaveBeenCalledWith(30);
        expect(documentService.getIrregular).toHaveBeenCalled();
    });

    it('should switch between tabs and render corresponding content', async () => {
        render(<MonitorOrchestrator />);
        
        await waitFor(() => expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument());

        // Default is irregular
        expect(screen.getByText('Empresa B')).toBeInTheDocument();

        // Switch to expiring
        const expiringTab = screen.getByRole('button', { name: /Documentos a Vencer/i });
        fireEvent.click(expiringTab);

        expect(screen.getByText('Vencimento 1')).toBeInTheDocument();
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
    });

    it('should update days filter and reload data', async () => {
        render(<MonitorOrchestrator />);
        
        await waitFor(() => expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument());

        const expiringTab = screen.getByRole('button', { name: /Documentos a Vencer/i });
        fireEvent.click(expiringTab);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '60' } });

        await waitFor(() => {
            expect(documentService.getExpiring).toHaveBeenCalledWith(60);
        });
    });

    it('should filter content based on searchTerm', async () => {
        render(<MonitorOrchestrator />);
        
        await waitFor(() => expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/Buscar empresa ou doc/i);
        fireEvent.change(searchInput, { target: { value: 'Empresa Inexistente' } });

        expect(screen.getByText('Tudo em conformidade!')).toBeInTheDocument();
    });

    it('should handle document download and show toast', async () => {
        (documentService.downloadDocument as any).mockResolvedValue(undefined);
        render(<MonitorOrchestrator />);
        
        await waitFor(() => expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument());

        const expiringTab = screen.getByRole('button', { name: /Documentos a Vencer/i });
        fireEvent.click(expiringTab);

        const downloadBtn = screen.getByRole('button', { name: /baixar/i });
        fireEvent.click(downloadBtn);

        expect(toast.info).toHaveBeenCalledWith('A iniciar download...');
        expect(documentService.downloadDocument).toHaveBeenCalledWith('exp-1', 'venc1.pdf');
    });

    it('should show toast error when service fails', async () => {
        (documentService.getIrregular as any).mockRejectedValue(new Error('API Error'));
        render(<MonitorOrchestrator />);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar o monitor de regularidade.');
        });
    });

    it('should show toast error when download fails', async () => {
        (documentService.downloadDocument as any).mockResolvedValue(undefined); // Reset default mock
        (documentService.downloadDocument as any).mockRejectedValue(new Error('Download Error'));
        render(<MonitorOrchestrator />);
        
        await waitFor(() => expect(screen.queryByText('A atualizar monitor...')).not.toBeInTheDocument());

        const expiringTab = screen.getByRole('button', { name: /Documentos a Vencer/i });
        fireEvent.click(expiringTab);

        const downloadBtn = screen.getByRole('button', { name: /baixar/i });
        fireEvent.click(downloadBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao baixar o arquivo.');
        });
    });
});
