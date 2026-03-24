import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentsTab } from './DocumentsTab';

const mockDocs = [
    { id: '1', title: 'Atos Constitutivos', filename: 'contrato_social.pdf', created_at: '2023-01-01T10:00:00Z' },
    { id: '2', title: 'Balanço Patrimonial', filename: 'balanco_2022.pdf', created_at: '2023-02-01T10:00:00Z' }
];

describe('DocumentsTab', () => {
    it('deve renderizar os cards de upload de documentos', () => {
        render(
            <DocumentsTab
                clientDocs={[]}
                isLoadingDocs={false}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={vi.fn()}
            />
        );

        expect(screen.getByText('Enviar Novos Documentos')).toBeInTheDocument();
        expect(screen.getByText('Atos e Procurações')).toBeInTheDocument();
        expect(screen.getByText('Capacidade Técnica')).toBeInTheDocument();
        expect(screen.getByText('Econômico-Financeira')).toBeInTheDocument();
        expect(screen.getByText('Outros')).toBeInTheDocument();
    });

    it('deve exibir mensagem de lista vazia quando não houver documentos', () => {
        render(
            <DocumentsTab
                clientDocs={[]}
                isLoadingDocs={false}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={vi.fn()}
            />
        );

        expect(screen.getByText('Nenhum documento anexado ainda.')).toBeInTheDocument();
        expect(screen.getByText('0 Arquivos')).toBeInTheDocument();
    });

    it('deve exibir skeletons quando estiver carregando documentos', () => {
        const { container } = render(
            <DocumentsTab
                clientDocs={[]}
                isLoadingDocs={true}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={vi.fn()}
            />
        );

        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve listar os documentos corretamente', () => {
        render(
            <DocumentsTab
                clientDocs={mockDocs}
                isLoadingDocs={false}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={vi.fn()}
            />
        );

        expect(screen.getByText('2 Arquivos')).toBeInTheDocument();
        expect(screen.getByText('Atos Constitutivos')).toBeInTheDocument();
        expect(screen.getByText('contrato_social.pdf')).toBeInTheDocument();
        expect(screen.getByText('Balanço Patrimonial')).toBeInTheDocument();
        expect(screen.getByText('balanco_2022.pdf')).toBeInTheDocument();
    });

    it('deve chamar handleDownloadDoc ao clicar no botão de download', () => {
        const handleDownloadDoc = vi.fn();
        render(
            <DocumentsTab
                clientDocs={mockDocs}
                isLoadingDocs={false}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={handleDownloadDoc}
                handleDeleteDoc={vi.fn()}
            />
        );

        const downloadButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-download'));
        fireEvent.click(downloadButtons[0]);

        expect(handleDownloadDoc).toHaveBeenCalledWith('1', 'contrato_social.pdf');
    });

    it('deve chamar handleDeleteDoc ao clicar no botão de excluir', () => {
        const handleDeleteDoc = vi.fn();
        render(
            <DocumentsTab
                clientDocs={mockDocs}
                isLoadingDocs={false}
                handleUploadDoc={vi.fn()}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={handleDeleteDoc}
            />
        );

        const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-trash2'));
        fireEvent.click(deleteButtons[1]);

        expect(handleDeleteDoc).toHaveBeenCalledWith('2');
    });

    it('deve chamar handleUploadDoc ao selecionar um arquivo num card de upload', () => {
        const handleUploadDoc = vi.fn();
        render(
            <DocumentsTab
                clientDocs={[]}
                isLoadingDocs={false}
                handleUploadDoc={handleUploadDoc}
                handleDownloadDoc={vi.fn()}
                handleDeleteDoc={vi.fn()}
            />
        );

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        // Encontrar o input escondido do card "Atos e Procurações"
        const card = screen.getByText('Atos e Procurações').closest('label');
        const input = card?.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, { target: { files: [file] } });

        expect(handleUploadDoc).toHaveBeenCalledWith(file, "Atos Constitutivos");
    });
});
