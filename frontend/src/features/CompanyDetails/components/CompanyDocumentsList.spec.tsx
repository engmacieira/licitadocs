import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompanyDocumentsList } from './CompanyDocumentsList';
import type { DocumentDTO } from '@/types';

const mockDocuments: DocumentDTO[] = [
    {
        id: 'doc-1',
        filename: 'contrato_social.pdf',
        title: 'Contrato Social',
        status: 'valid',
        created_at: '2023-10-27T10:00:00Z',
        is_structured: true
    },
    {
        id: 'doc-2',
        filename: 'comprovante_cnpj.png',
        title: 'Cartão CNPJ',
        status: 'valid',
        created_at: '2023-10-28T14:30:00Z',
        is_structured: true
    }
];

describe('CompanyDocumentsList', () => {
    it('deve renderizar a lista de documentos corretamente', () => {
        render(<CompanyDocumentsList documents={mockDocuments} onDownload={vi.fn()} />);

        expect(screen.getByText('Arquivos Enviados (2)')).toBeInTheDocument();
        expect(screen.getByText('Contrato Social')).toBeInTheDocument();
        expect(screen.getByText('Cartão CNPJ')).toBeInTheDocument();
        expect(screen.getByText('contrato_social.pdf')).toBeInTheDocument();
        expect(screen.getByText('comprovante_cnpj.png')).toBeInTheDocument();
        
        // Verificando formatação de data (date-fns dd/MM/yyyy)
        expect(screen.getByText('27/10/2023')).toBeInTheDocument();
        expect(screen.getByText('28/10/2023')).toBeInTheDocument();
    });

    it('deve exibir mensagem de vazio quando não houver documentos', () => {
        render(<CompanyDocumentsList documents={[]} onDownload={vi.fn()} />);

        expect(screen.getByText('Arquivos Enviados (0)')).toBeInTheDocument();
        expect(screen.getByText('Nenhum documento encontrado para esta empresa.')).toBeInTheDocument();
    });

    it('deve chamar onDownload com o documento correto ao clicar no botão', () => {
        const onDownload = vi.fn();
        render(<CompanyDocumentsList documents={mockDocuments} onDownload={onDownload} />);

        const downloadButtons = screen.getAllByRole('button');
        fireEvent.click(downloadButtons[0]);

        expect(onDownload).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('deve usar o filename como título se title estiver ausente', () => {
        const docsWithoutTitle = [{
            ...mockDocuments[0],
            title: undefined
        }];

        render(<CompanyDocumentsList documents={docsWithoutTitle as any} onDownload={vi.fn()} />);

        // O componente usa {doc.title || doc.filename}
        const titleElements = screen.getAllByText('contrato_social.pdf');
        expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });
});
