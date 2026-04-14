// src/features/DocumentTemplates/components/PDFTemplate.spec.tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PDFTemplate } from './PDFTemplate';

// Mock do @react-pdf/renderer - Essencial para não tentar renderizar PDFs reais no Node
vi.mock('@react-pdf/renderer', () => ({
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children, size, style }: any) => (
        <div data-testid="pdf-page" data-size={size} style={style}>
            {children}
        </div>
    ),
    // O mock do Text simula a renderização dinâmica (rodapé com página)
    Text: ({ children, style, render }: any) => {
        if (render) return <span data-testid="pdf-text-render">{render({ pageNumber: 1, totalPages: 5 })}</span>;
        return <span style={style}>{children}</span>;
    },
    View: ({ children, style }: any) => <div style={style}>{children}</div>,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() },
}));

describe('PDFTemplate - Motor de Geração (US-3004)', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '14 de Abril de 2026',
        nomeRepresentante: 'Representante Teste',
        cpfRepresentante: '000.000.000-00'
    };

    it('deve renderizar o cabeçalho de autoridade com a tag LICITADOCS', () => {
        render(
            <PDFTemplate
                title="Título Teste"
                contentBlocks={['Parágrafo 1']}
                companyData={mockCompanyData}
            />
        );

        // Usamos getAllByText pois o nome aparece no Header e na Assinatura
        const nameElements = screen.getAllByText('Empresa Teste LTDA');
        expect(nameElements.length).toBeGreaterThan(1);
        expect(nameElements[0]).toBeInTheDocument();

        expect(screen.getByText(/12.345.678\/0001-90/i)).toBeInTheDocument();
        expect(screen.getByText('LICITADOCS')).toBeInTheDocument();
    });

    it('Cenário Atestado: deve exibir o papel correto para assinatura do emissor', () => {
        render(
            <PDFTemplate
                title="Atestado"
                contentBlocks={['Conteúdo']}
                companyData={mockCompanyData}
                isAttestation={true}
                customSignatureName="Cliente Especial"
            />
        );

        expect(screen.getByText('Cliente Especial')).toBeInTheDocument();
        expect(screen.getByText('Assinatura do Emissor (Atestante)')).toBeInTheDocument();
    });

    it('Cenário Declaração: deve exibir o CPF do representante na assinatura', () => {
        render(
            <PDFTemplate
                title="Declaração"
                contentBlocks={['Conteúdo']}
                companyData={mockCompanyData}
                isAttestation={false}
            />
        );

        expect(screen.getByText(`Representante Legal: ${mockCompanyData.nomeRepresentante}`)).toBeInTheDocument();
        expect(screen.getByText(/CPF: 000.000.000-00/i)).toBeInTheDocument();
    });

    it('deve renderizar o rodapé com paginação e data de emissão', () => {
        render(
            <PDFTemplate
                title="T"
                contentBlocks={['B']}
                companyData={mockCompanyData}
            />
        );

        // O mock simula Página 1 de 5
        const expectedFooter = /Documento gerado eletronicamente via LicitaDocs em 14 de Abril de 2026 • Página 1 de 5/i;
        expect(screen.getByTestId('pdf-text-render')).toHaveTextContent(expectedFooter);
    });
});