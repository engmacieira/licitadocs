// src/features/DocumentTemplates/components/DeclarationSection.spec.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DeclarationSection } from './DeclarationSection';
import { generateDocx } from '../utils/docxGenerator';

// Mock do gerador de Word
vi.mock('../utils/docxGenerator', () => ({
    generateDocx: vi.fn(),
}));

// Mock do dicionário (Caminho deve ser igual ao import do componente)
vi.mock('../../../lib/templateDictionary', () => ({
    getTemplateContent: () => ({
        title: 'DECLARAÇÕES UNIFICADAS',
        buildBody: () => ['Parágrafo 1 de teste', 'Parágrafo 2 de teste']
    })
}));

// Mock do PDF Renderer
vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: ({ children }: any) => children({ loading: false }),
    Document: ({ children }: any) => <div>{children}</div>,
    Page: ({ children }: any) => <div>{children}</div>,
    Text: ({ children }: any) => <span>{children}</span>,
    View: ({ children }: any) => <div>{children}</div>,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() },
}));

// Mock do template do PDF
vi.mock('./PDFTemplate', () => ({
    PDFTemplate: () => <div data-testid="pdf-template" />
}));

describe('DeclarationSection', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '14 de Abril de 2026',
        nomeRepresentante: 'Representante Teste',
        cpfRepresentante: '000.000.000-00'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve abrir o modal de alerta legal ao clicar em gerar rascunho', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        const docxBtn = screen.getByRole('button', { name: /gerar rascunho \(\.docx\)/i });
        await user.click(docxBtn);

        // Verifica os novos textos da US-3002
        expect(screen.getByText(/Termo de Responsabilidade/i)).toBeInTheDocument();
        expect(screen.getByText(/atesta sob as penas da lei/i)).toBeInTheDocument();
    });

    it('deve disparar o download do docx após aceitar o termo no modal', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        // 1. Abre o modal
        await user.click(screen.getByRole('button', { name: /gerar rascunho \(\.docx\)/i }));

        // 2. Clica no botão de confirmação
        const confirmBtn = screen.getByRole('button', { name: /entendi e baixar arquivo \(\.docx\)/i });
        await user.click(confirmBtn);

        expect(generateDocx).toHaveBeenCalledWith(
            'DECLARAÇÕES UNIFICADAS',
            expect.any(Array),
            mockCompanyData,
            'Declaracoes_Unificadas_Habilitacao'
        );
    });

    it('deve mostrar a explicação legal ao expandir o conteúdo educativo', async () => {
        const user = userEvent.setup();
        render(<DeclarationSection companyData={mockCompanyData} />);

        const toggleBtn = screen.getByText(/Por que este documento é necessário\?/i);
        await user.click(toggleBtn);

        expect(screen.getByText(/Nos processos licitatórios/i)).toBeInTheDocument();
        expect(screen.getByText(/Não emprego de menores/i)).toBeInTheDocument();
    });
});