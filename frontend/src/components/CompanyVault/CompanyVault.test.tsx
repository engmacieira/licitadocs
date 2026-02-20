import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyVault } from './index';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKING DA API DE DOWNLOAD E TOAST
// ==========================================
vi.mock('../../services/documentService', () => ({
    documentService: {
        downloadDocument: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

// ==========================================
// 🏭 FÁBRICA DE DADOS (MOCK DTOs)
// ==========================================
const mockDocuments = [
    {
        id: 'doc-1',
        title: 'Contrato Social',
        filename: 'contrato.pdf',
        status: 'active',
        category_name: 'Legal',
        created_at: '2023-01-01T10:00:00Z',
        expiration_date: '2025-12-31T23:59:59Z',
        is_structured: true,            // 👈 MUDAR PARA TRUE
        authentication_code: 'XYZ-123', // 👈 MOVER O CÓDIGO PARA CÁ
    },
    {
        id: 'doc-2',
        title: 'Alvará Vencido',
        filename: 'alvara_2022.pdf',
        status: 'expired',
        category_name: 'Legal',
        created_at: '2022-01-01T10:00:00Z',
        expiration_date: '2022-12-31T23:59:59Z',
        is_structured: false,           // 👈 MUDAR PARA FALSE
        authentication_code: null,      // 👈 LIMPAR O CÓDIGO AQUI
    },
    {
        id: 'doc-3',
        title: 'Doc Sem Categoria',
        filename: 'anexo.pdf',
        status: 'processing', // Testando o status novo!
        category_name: null, // Deve cair em "Outros Documentos"
        created_at: '2023-05-05T10:00:00Z',
        expiration_date: null,
        is_structured: false,
        authentication_code: null,
    }
] as any[]; // 'as any[]' para contornar tipagens estritas do TypeScript no mock

describe('CompanyVault Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir mensagem de cofre vazio se não houver documentos', () => {
        render(<CompanyVault documents={[]} />);
        expect(screen.getByText('Nenhum documento encontrado neste cofre.')).toBeInTheDocument();
    });

    it('deve agrupar documentos por categoria e fallback para "Outros Documentos"', () => {
        render(<CompanyVault documents={mockDocuments} />);

        // Verifica os títulos das categorias
        expect(screen.getByText('Legal')).toBeInTheDocument();
        expect(screen.getByText('Outros Documentos')).toBeInTheDocument();

        // Verifica os nomes dos documentos agrupados
        expect(screen.getByText('Contrato Social')).toBeInTheDocument();
        expect(screen.getByText('Doc Sem Categoria')).toBeInTheDocument();
    });

    it('deve exibir os badges de status corretamente', () => {
        render(<CompanyVault documents={mockDocuments} />);

        // doc-1 (active) -> Vigente
        expect(screen.getByText('Vigente')).toBeInTheDocument();

        // doc-3 (processing) -> Processando
        expect(screen.getByText('Processando')).toBeInTheDocument();

        // As tags de documentos estruturados (is_structured: true)
        expect(screen.getByText('INTELIGENTE')).toBeInTheDocument();
        expect(screen.getByText('XYZ-123')).toBeInTheDocument();
    });

    it('deve ocultar documentos vencidos até clicar em "Ver Histórico"', async () => {
        const user = userEvent.setup();
        render(<CompanyVault documents={mockDocuments} />);

        // O documento vencido NÃO deve estar visível no início (está oculto no histórico)
        expect(screen.queryByText('Alvará Vencido')).not.toBeInTheDocument();

        // Clica para expandir o histórico
        const historyButton = screen.getByText('Ver Histórico (1)');
        await user.click(historyButton);

        // Agora o documento vencido deve aparecer!
        expect(screen.getByText('Alvará Vencido')).toBeInTheDocument();
        expect(screen.getByText('Ocultar Histórico Vencido')).toBeInTheDocument();
    });

    it('deve chamar o downloadService e exibir toast de sucesso ao clicar no botão de baixar', async () => {
        const user = userEvent.setup();
        // Fingimos que o download resolve com sucesso
        (documentService.downloadDocument as any).mockResolvedValueOnce();

        render(<CompanyVault documents={[mockDocuments[0]]} />);

        // Clica no botão de download (buscamos pelo 'title' do botão que você definiu)
        const downloadBtn = screen.getByTitle('Baixar Arquivo');
        await user.click(downloadBtn);

        // Verifica se avisou o usuário
        expect(toast.info).toHaveBeenCalledWith('Iniciando download...');

        // Verifica se chamou a API de fato com o ID e o Filename corretos!
        expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-1', 'contrato.pdf');
    });

    it('deve exibir toast de erro se o download falhar', async () => {
        const user = userEvent.setup();
        // Fingimos uma queda de conexão no download
        (documentService.downloadDocument as any).mockRejectedValueOnce(new Error('Network error'));

        render(<CompanyVault documents={[mockDocuments[0]]} />);

        await user.click(screen.getByTitle('Baixar Arquivo'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao baixar o arquivo.');
        });
    });

    it('deve recolher e expandir uma categoria inteira ao clicar no header', async () => {
        const user = userEvent.setup();
        render(<CompanyVault documents={[mockDocuments[0]]} />);

        // Inicialmente aberto (Vemos o documento)
        expect(screen.getByText('Contrato Social')).toBeInTheDocument();

        // Clica no título da categoria "Legal" para fechar (accordion)
        await user.click(screen.getByText('Legal'));

        // O documento deve desaparecer da tela
        expect(screen.queryByText('Contrato Social')).not.toBeInTheDocument();
    });
});