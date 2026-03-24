import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { DeclarationSection } from './DeclarationSection';
import { generateDocx } from '../utils/docxGenerator';

// Mock do docxGenerator
vi.mock('../utils/docxGenerator', () => ({
    generateDocx: vi.fn(),
}));

// Mock do @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: ({ children }: any) => children({ loading: false }),
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
    Text: ({ children }: any) => <span>{children}</span>,
    View: ({ children }: any) => <div>{children}</div>,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() },
}));

// Mock do PDFTemplate para simplificar
vi.mock('./PDFTemplate', () => ({
    PDFTemplate: () => <div data-testid="pdf-template" />
}));

describe('DeclarationSection', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '23 de Março de 2026',
        nomeRepresentante: 'Representante Legal',
        cpfRepresentante: '111.222.333-44'
    };

    it('deve renderizar o título e a descrição', () => {
        render(<DeclarationSection companyData={mockCompanyData} />);
        
        expect(screen.getByText('Declarações Unificadas')).toBeInTheDocument();
        expect(screen.getByText(/Conjunto de declarações padrão exigidas/i)).toBeInTheDocument();
    });

    it('deve substituir os placeholders no texto de pré-visualização', () => {
        render(<DeclarationSection companyData={mockCompanyData} />);
        
        // Os dados aparecem em múltiplos lugares (pré-visualização e rodapé)
        expect(screen.getAllByText(/Empresa Teste LTDA/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/12.345.678\/0001-90/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Sinfonia\/JS/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/23 de Março de 2026/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Representante Legal/i).length).toBeGreaterThan(0);
    });

    it('deve chamar generateDocx ao clicar no botão de baixar Word', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        const downloadButton = screen.getByRole('button', { name: /baixar em word \(.docx\)/i });
        await user.click(downloadButton);

        expect(generateDocx).toHaveBeenCalledWith(
            'DECLARAÇÕES UNIFICADAS',
            expect.any(Array),
            mockCompanyData,
            'Declaracoes_Unificadas_Habilitacao'
        );
    });

    it('deve renderizar o link de download do PDF', () => {
        render(<DeclarationSection companyData={mockCompanyData} />);
        
        expect(screen.getByText(/Baixar PDF Caprichado/i)).toBeInTheDocument();
    });
});
