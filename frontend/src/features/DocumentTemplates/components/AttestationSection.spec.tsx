import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AttestationSection } from './AttestationSection';
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

describe('AttestationSection', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '23 de Março de 2026',
        nomeRepresentante: 'Representante Legal',
        cpfRepresentante: '111.222.333-44'
    };

    it('deve renderizar corretamente com os dados da empresa', () => {
        render(<AttestationSection companyData={mockCompanyData} />);
        
        expect(screen.getByText('Atestado de Capacidade Técnica')).toBeInTheDocument();
        expect(screen.getByText(/Modelo para o seu cliente preencher/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Prefeitura Municipal de Braúnas/i)).toBeInTheDocument();
    });

    it('deve atualizar os campos de input e refletir no estado local', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        const clientInput = screen.getByLabelText(/Empresa Cliente/i);
        const cnpjInput = screen.getByLabelText(/CNPJ do Cliente/i);
        const serviceInput = screen.getByLabelText(/Descrição do Serviço/i);

        await user.type(clientInput, 'Cliente XYZ');
        await user.type(cnpjInput, '98.765.432/0001-10');
        await user.type(serviceInput, 'Serviços de Consultoria');

        expect(clientInput).toHaveValue('Cliente XYZ');
        expect(cnpjInput).toHaveValue('98.765.432/0001-10');
        expect(serviceInput).toHaveValue('Serviços de Consultoria');
    });

    it('deve chamar generateDocx ao clicar no botão de baixar Word', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        const downloadButton = screen.getByRole('button', { name: /baixar \(.docx\)/i });
        await user.click(downloadButton);

        expect(generateDocx).toHaveBeenCalled();
        // Verifica se o primeiro argumento é o título correto
        expect(generateDocx).toHaveBeenCalledWith(
            'ATESTADO DE CAPACIDADE TÉCNICA',
            expect.any(Array),
            mockCompanyData,
            'Atestado_Capacidade_Tecnica'
        );
    });

    it('deve renderizar o link de download do PDF', () => {
        render(<AttestationSection companyData={mockCompanyData} />);
        
        expect(screen.getByText(/Baixar PDF Caprichado/i)).toBeInTheDocument();
    });
});
