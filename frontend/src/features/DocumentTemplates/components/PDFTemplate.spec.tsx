import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PDFTemplate } from './PDFTemplate';

// Mock do @react-pdf/renderer (Simula o motor de PDF na web)
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
        nomeRepresentante: 'Matheus Dev',
        cpfRepresentante: '000.000.000-00'
    };

    it('deve renderizar o cabeçalho da empresa, título e os blocos de conteúdo', () => {
        const title = 'DECLARAÇÃO TESTE';
        const contentBlocks = ['Primeiro parágrafo injetado.', 'Segundo parágrafo de teste.'];

        render(<PDFTemplate title={title} contentBlocks={contentBlocks} companyData={mockCompanyData} />);

        // 1. Verifica Cabeçalho e Assinatura (BugHunter Fix: agora aceita as duas ocorrências)
        const nameElements = screen.getAllByText('Empresa Teste LTDA');
        expect(nameElements.length).toBe(2); // Uma no topo, outra na assinatura

        expect(screen.getByText(/12\.345\.678\/0001-90/)).toBeInTheDocument();

        // 2. Verifica Conteúdo
        expect(screen.getByText('DECLARAÇÃO TESTE')).toBeInTheDocument();
        expect(screen.getByText('Primeiro parágrafo injetado.')).toBeInTheDocument();

        // 3. Verifica Marca d'água/Tag
        expect(screen.getByText('LicitaDocs')).toBeInTheDocument();
    });

    it('Cenário Atestado: deve usar o nome customizado do cliente se fornecido', () => {
        render(
            <PDFTemplate
                title="Atestado"
                contentBlocks={['Conteúdo']}
                companyData={mockCompanyData}
                isAttestation={true}
                customSignatureName="Prefeitura Municipal de JS"
            />
        );

        expect(screen.getByText('Prefeitura Municipal de JS')).toBeInTheDocument();
        expect(screen.getByText('Assinatura do Emissor')).toBeInTheDocument();
    });

    it('Cenário Atestado: deve utilizar a linha em branco como fallback se não houver nome', () => {
        render(
            <PDFTemplate
                title="Atestado"
                contentBlocks={['Conteúdo']}
                companyData={mockCompanyData}
                isAttestation={true}
            />
        );

        expect(screen.getByText('__________________________')).toBeInTheDocument();
        expect(screen.getByText('Assinatura do Emissor')).toBeInTheDocument();
    });

    it('Cenário Declaração: deve preencher automaticamente a assinatura com os dados da empresa', () => {
        render(
            <PDFTemplate
                title="Declaração"
                contentBlocks={['Conteúdo']}
                companyData={mockCompanyData}
            // isAttestation é false por padrão
            />
        );

        // Numa declaração, quem assina é o representante legal
        expect(screen.getByText(`Representante Legal: ${mockCompanyData.nomeRepresentante}`)).toBeInTheDocument();
    });

    it('deve renderizar o rodapé com os dados de rastreabilidade e paginação dinâmica', () => {
        render(<PDFTemplate title="T" contentBlocks={['B']} companyData={mockCompanyData} />);

        // Simulámos que a render() retorna pageNumber: 1 e totalPages: 5 no mock lá no topo
        const expectedFooter = `Documento gerado via LicitaDocs em ${mockCompanyData.dataAtual} - Página 1 de 5`;
        expect(screen.getByText(expectedFooter)).toBeInTheDocument();
    });
});