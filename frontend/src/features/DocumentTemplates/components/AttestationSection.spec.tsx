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

describe('AttestationSection - US-3004 & US-3001', () => {
    const mockCompanyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Teste, 123',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '23 de Março de 2026',
        nomeRepresentante: 'Representante Legal',
        cpfRepresentante: '111.222.333-44'
    };

    it('deve exibir as informações didáticas ao clicar na lâmpada (US-3001)', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        const infoButton = screen.getByTitle(/O que é este documento/i);
        await user.click(infoButton);

        expect(screen.getByText(/Para que serve\?/i)).toBeInTheDocument();
        expect(screen.getByText(/Comprova que sua empresa já executou serviços similares/i)).toBeInTheDocument();
    });

    it('deve preencher todos os novos campos do formulário (US-3004)', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        // BugHunter Tip: Use regex para ignorar variações de maiúsculas/minúsculas e ícones
        const clientInput = screen.getByLabelText(/Razão Social do Cliente/i);
        const cnpjInput = screen.getByLabelText(/CNPJ do Cliente/i);
        const serviceTypeSelect = screen.getByLabelText(/Tipo de Atuação/i);
        const descriptionInput = screen.getByLabelText(/Descrição resumida do objeto/i);
        const nfInput = screen.getByLabelText(/Nota Fiscal Nº/i);

        await user.type(clientInput, 'Prefeitura de Xiririca');
        await user.type(cnpjInput, '00.111.222/0001-33');
        await user.selectOptions(serviceTypeSelect, 'prestou os serviços de');
        await user.type(descriptionInput, 'Consultoria em QA');
        await user.type(nfInput, 'NF-999');

        expect(clientInput).toHaveValue('Prefeitura de Xiririca');
        expect(serviceTypeSelect).toHaveValue('prestou os serviços de');
        expect(nfInput).toHaveValue('NF-999');
    });

    it('deve abrir o modal de segurança e só então chamar generateDocx (Fluxo Crítico)', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        // 1. Clicar no botão inicial de download
        const initialDownloadBtn = screen.getByRole('button', { name: /baixar word/i });
        await user.click(initialDownloadBtn);

        // 2. Verificar se o modal de segurança apareceu (US-3002)
        expect(screen.getByText(/Atenção ao Emissor/i)).toBeInTheDocument();
        expect(screen.getByText(/papel timbrado do seu cliente/i)).toBeInTheDocument();

        // 3. Clicar no botão de confirmação dentro do modal
        const confirmBtn = screen.getByRole('button', { name: /entendi e baixar word/i });
        await user.click(confirmBtn);

        // 4. Agora sim o mock deve ter sido chamado
        expect(generateDocx).toHaveBeenCalledTimes(1);
        expect(generateDocx).toHaveBeenCalledWith(
            'ATESTADO DE CAPACIDADE TÉCNICA',
            expect.any(Array),
            mockCompanyData,
            'Atestado_Capacidade_Tecnica'
        );
    });

    it('deve validar se o modal de segurança fecha ao clicar em revisar dados', async () => {
        const user = userEvent.setup();
        render(<AttestationSection companyData={mockCompanyData} />);

        await user.click(screen.getByRole('button', { name: /gerar pdf/i }));
        const backBtn = screen.getByRole('button', { name: /voltar para revisar dados/i });

        await user.click(backBtn);

        expect(screen.queryByText(/Atenção ao Emissor/i)).not.toBeInTheDocument();
    });
});
