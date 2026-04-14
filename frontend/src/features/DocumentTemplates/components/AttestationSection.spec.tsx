// src/features/DocumentTemplates/components/AttestationSection.spec.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AttestationSection } from './AttestationSection';
import { generateDocx } from '../utils/docxGenerator';

// Mock do docxGenerator
vi.mock('../utils/docxGenerator', () => ({
    generateDocx: vi.fn(),
}));

// Mock do dicionário para não depender de arquivos externos
vi.mock('../../../lib/templateDictionary', () => ({
    getTemplateContent: () => ({
        title: 'ATESTADO DE CAPACIDADE TÉCNICA',
        buildBody: () => ['Bloco de teste 1', 'Bloco de teste 2']
    })
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

// Mock do PDFTemplate
vi.mock('./PDFTemplate', () => ({
    PDFTemplate: () => <div data-testid="pdf-template" />
}));

describe('AttestationSection', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-91',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Cidade/UF',
        dataAtual: '01 de Janeiro de 2024',
        nomeRepresentante: 'Representante Teste',
        cpfRepresentante: '000.000.000-00'
    };

    it('deve abrir o modal de segurança ao tentar baixar o .docx', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        // O botão agora se chama apenas ".docx"
        const downloadBtn = screen.getByRole('button', { name: /\.docx/i });
        await user.click(downloadBtn);

        // Verifica se o modal abriu com o texto correto da US-3002
        expect(screen.getByText(/Atenção ao Emissor/i)).toBeInTheDocument();
        expect(screen.getByText(/deve ser assinado pelo seu cliente/i)).toBeInTheDocument();
    });

    it('deve chamar o gerador de docx após confirmar no modal', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        // 1. Abre modal
        await user.click(screen.getByRole('button', { name: /\.docx/i }));

        // 2. Clica no botão de confirmação dentro do modal
        const confirmBtn = screen.getByRole('button', { name: /confirmar e baixar \(\.docx\)/i });
        await user.click(confirmBtn);

        expect(generateDocx).toHaveBeenCalled();
    });

    it('deve atualizar os campos do formulário corretamente', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        const inputCliente = screen.getByPlaceholderText(/Ex: Prefeitura Municipal de/i);
        await user.type(inputCliente, 'Prefeitura de SP');

        expect(inputCliente).toHaveValue('Prefeitura de SP');
    });
});