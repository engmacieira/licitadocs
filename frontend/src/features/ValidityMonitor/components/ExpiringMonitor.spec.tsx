import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExpiringMonitor } from './ExpiringMonitor';
import type { DocumentDTO } from '../../../services/documentService';

const mockDocuments: DocumentDTO[] = [
    {
        id: '1',
        filename: 'certidao_federal.pdf',
        title: 'Certidão Federal',
        status: 'valid',
        expiration_date: '2026-10-20T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        company_name: 'Empresa A',
        is_structured: true
    },
    {
        id: '2',
        filename: 'alvara.pdf',
        title: 'Alvará de Funcionamento',
        status: 'valid',
        expiration_date: '2026-11-15T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        company_name: 'Empresa B',
        is_structured: true
    }
];

describe('ExpiringMonitor Component', () => {
    const defaultProps = {
        documents: mockDocuments,
        searchTerm: '',
        daysFilter: 30,
        onDownload: vi.fn()
    };

    it('should render all documents in the list', () => {
        render(<ExpiringMonitor {...defaultProps} />);
        
        expect(screen.getByText('Certidão Federal')).toBeInTheDocument();
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
        expect(screen.getByText('Empresa B')).toBeInTheDocument();
    });

    it('should filter documents by searchTerm (company name)', () => {
        render(<ExpiringMonitor {...defaultProps} searchTerm="Empresa A" />);
        
        expect(screen.getByText('Certidão Federal')).toBeInTheDocument();
        expect(screen.queryByText('Alvará de Funcionamento')).not.toBeInTheDocument();
    });

    it('should filter documents by searchTerm (document title)', () => {
        render(<ExpiringMonitor {...defaultProps} searchTerm="Alvará" />);
        
        expect(screen.queryByText('Certidão Federal')).not.toBeInTheDocument();
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
    });

    it('should render empty state when no documents match search', () => {
        render(<ExpiringMonitor {...defaultProps} searchTerm="Nonexistent" />);
        
        expect(screen.getByText('Nenhum vencimento próximo.')).toBeInTheDocument();
        expect(screen.getByText('Não há documentos a vencer nos próximos 30 dias.')).toBeInTheDocument();
    });

    it('should render empty state when documents list is empty', () => {
        render(<ExpiringMonitor {...defaultProps} documents={[]} />);
        
        expect(screen.getByText('Nenhum vencimento próximo.')).toBeInTheDocument();
    });

    it('should call onDownload when download button is clicked', () => {
        render(<ExpiringMonitor {...defaultProps} />);
        
        const downloadButtons = screen.getAllByRole('button', { name: /baixar/i });
        fireEvent.click(downloadButtons[0]);
        
        expect(defaultProps.onDownload).toHaveBeenCalledWith('1', 'certidao_federal.pdf');
    });

    it('should format the expiration date correctly', () => {
        const docWithDate: DocumentDTO = {
            ...mockDocuments[0],
            expiration_date: '2026-10-20T12:00:00Z' // Use mid-day to avoid day shift
        };
        render(<ExpiringMonitor {...defaultProps} documents={[docWithDate]} />);
        
        expect(screen.getByText(/Vence: 20\/10\/2026/i)).toBeInTheDocument();
    });
});
