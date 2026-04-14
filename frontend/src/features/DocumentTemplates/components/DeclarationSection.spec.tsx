import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DeclarationSection } from './DeclarationSection';
import { generateDocx } from '../utils/docxGenerator';

// Mocks
vi.mock('../utils/docxGenerator', () => ({
    generateDocx: vi.fn(),
}));

vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: ({ children, onClick }: any) => (
        <div onClick={onClick} data-testid="pdf-link">
            {children({ loading: false })}
        </div>
    ),
}));

vi.mock('./PDFTemplate', () => ({
    PDFTemplate: () => <div data-testid="pdf-template" />
}));

describe('DeclarationSection - US-3001 & US-3002', () => {
    // Agora passamos apenas o companyData, pois o resto está fixo no componente
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '2026-04-14',
        nomeRepresentante: 'Matheus Dev',
        cpfRepresentante: '000.000.000-00'
    };

    it('deve alternar a visibilidade do conteúdo didático (US-3001)', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        // Inicialmente a base legal não aparece
        expect(screen.queryByText(/Base Legal/i)).not.toBeInTheDocument();

        // Clica na lâmpada
        const infoButton = screen.getByTitle(/O que é este documento/i);
        await user.click(infoButton);

        // Procura pelos textos REAIS que estão hardcoded no componente
        expect(screen.getByText(/Gera o documento onde a empresa declara veracidade/i)).toBeInTheDocument();
        expect(screen.getByText(/Lei nº 14.133\/2021/i)).toBeInTheDocument();
    });

    it('deve exigir confirmação no modal de segurança antes do download DOCX (US-3002)', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        // Correção 1: O nome do botão real no componente é "Baixar em Word"
        const wordBtn = screen.getByRole('button', { name: /baixar em word/i });
        await user.click(wordBtn);

        expect(screen.getByText(/Atenção e Responsabilidade/i)).toBeInTheDocument();

        // O download NÃO deve ter sido chamado ainda
        expect(generateDocx).not.toHaveBeenCalled();

        // Confirmar no modal
        const confirmBtn = screen.getByRole('button', { name: /entendi e baixar word/i });
        await user.click(confirmBtn);

        // Correção 2: Valida os nomes exatos que estão configurados na função do componente
        expect(generateDocx).toHaveBeenCalledWith(
            'DECLARAÇÕES UNIFICADAS',
            expect.any(Array), // Aceita o array de textos
            mockCompanyData,
            'Declaracoes_Unificadas_Habilitacao'
        );
    });

    it('deve fechar o modal sem baixar nada ao clicar em revisar (Cenário de Desistência)', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        await user.click(screen.getByRole('button', { name: /gerar pdf/i }));

        const backBtn = screen.getByRole('button', { name: /voltar para revisar/i });
        await user.click(backBtn);

        expect(screen.queryByText(/Atenção e Responsabilidade/i)).not.toBeInTheDocument();
        expect(generateDocx).not.toHaveBeenCalled();
    });
});