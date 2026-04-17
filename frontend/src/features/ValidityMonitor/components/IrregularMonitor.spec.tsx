import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IrregularMonitor } from './IrregularMonitor';
import type { DocumentDTO } from '../../../types';

const mockIrregularDocs: DocumentDTO[] = [
    {
        id: '1',
        filename: 'certidao_cadastral.pdf',
        title: 'Certidão Cadastral',
        status: 'irregular',
        created_at: '2025-01-01T00:00:00Z',
        company_id: 'comp-1',
        company_name: 'Empresa Alfa',
        company_cnpj: '11.222.333/0001-44',
        is_structured: true
    },
    {
        id: '2',
        filename: 'erro_emissao.pdf',
        title: 'Falha na Emissão FGTS',
        status: 'error',
        created_at: '2025-01-01T00:00:00Z',
        company_id: 'comp-1',
        company_name: 'Empresa Alfa',
        company_cnpj: '11.222.333/0001-44',
        is_structured: true
    },
    {
        id: '3',
        filename: 'doc_beta.pdf',
        title: 'Certidão Municipal',
        status: 'irregular',
        created_at: '2025-01-01T00:00:00Z',
        company_id: 'comp-2',
        company_name: 'Empresa Beta',
        company_cnpj: '55.666.777/0001-88',
        is_structured: true
    }
];

describe('IrregularMonitor Component', () => {
    const defaultProps = {
        documents: mockIrregularDocs,
        searchTerm: ''
    };

    it('should render documents grouped by company', () => {
        render(<IrregularMonitor {...defaultProps} />);
        
        expect(screen.getByText('Empresa Alfa')).toBeInTheDocument();
        expect(screen.getByText('CNPJ: 11.222.333/0001-44')).toBeInTheDocument();
        expect(screen.getByText('2 Pendências')).toBeInTheDocument();

        expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
        expect(screen.getByText('CNPJ: 55.666.777/0001-88')).toBeInTheDocument();
        expect(screen.getByText('1 Pendência')).toBeInTheDocument();
    });

    it('should display document status badges correctly', () => {
        render(<IrregularMonitor {...defaultProps} />);
        
        expect(screen.getByText('Erro Emissão')).toBeInTheDocument();
        expect(screen.getAllByText('Irregular')).toHaveLength(2);
    });

    it('should filter documents/companies by searchTerm', () => {
        render(<IrregularMonitor {...defaultProps} searchTerm="Alfa" />);
        
        expect(screen.getByText('Empresa Alfa')).toBeInTheDocument();
        expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument();
    });

    it('should render empty state when no documents match search', () => {
        render(<IrregularMonitor {...defaultProps} searchTerm="Inexistente" />);
        
        expect(screen.getByText('Tudo em conformidade!')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma empresa apresenta documentos irregulares ou com erro no momento.')).toBeInTheDocument();
    });

    it('should render empty state when document list is empty', () => {
        render(<IrregularMonitor {...defaultProps} documents={[]} />);
        
        expect(screen.getByText('Tudo em conformidade!')).toBeInTheDocument();
    });
});
