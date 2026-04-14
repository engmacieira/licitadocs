import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as docx from 'docx';
import { saveAs } from 'file-saver';
import { generateDocx } from './docxGenerator';

// Mock do file-saver
vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

// Mock do docx resolvendo o problema do Construtor
vi.mock('docx', async (importOriginal) => {
    const actual = await importOriginal<typeof import('docx')>();

    return {
        ...actual,
        PageNumber: actual.PageNumber || { CURRENT: 'CURRENT', TOTAL_PAGES: 'TOTAL_PAGES' },
        AlignmentType: actual.AlignmentType || { CENTER: 'center', BOTH: 'both', LEFT: 'left', RIGHT: 'right' },
        HeadingLevel: actual.HeadingLevel || { HEADING_1: 'Heading1' },
        BorderStyle: actual.BorderStyle || { SINGLE: 'single', NONE: 'none' },

        Packer: {
            toBlob: vi.fn().mockResolvedValue(new Blob(['test-content'], { type: 'application/msword' })),
        },

        // 👇 A CORREÇÃO ESTÁ AQUI: vi.fn() puro suporta a palavra 'new'!
        Document: vi.fn(),
    };
});

describe('docxGenerator - Motor de Documentos (US-3004 & US-3005)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockData = {
        razaoSocial: 'LICITADOCS TECNOLOGIA LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua dos Testes, 404',
        cidadeUf: 'Software/QA',
        dataAtual: '14 de Abril de 2026',
        nomeRepresentante: 'Matheus Trainee',
        cpfRepresentante: '123.456.789-00'
    };

    it('deve gerar um documento e disparar o download com o nome correto', async () => {
        const filename = 'Meu_Documento_Oficial';

        await generateDocx('TÍTULO', ['Bloco 1'], mockData, filename);

        expect(docx.Packer.toBlob).toHaveBeenCalled();

        await vi.waitFor(() => {
            expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), `${filename}.docx`);
        });
    });

    it('deve aplicar a regra de assinatura para DECLARAÇÕES (Assina a própria empresa)', async () => {
        await generateDocx('DECLARAÇÃO', ['Conteúdo'], mockData, 'test', false);

        expect(docx.Document).toHaveBeenCalledWith(expect.objectContaining({
            sections: expect.arrayContaining([
                expect.objectContaining({
                    children: expect.any(Array)
                })
            ])
        }));
    });

    it('deve aplicar a regra de assinatura para ATESTADOS (Assina o cliente/emissor)', async () => {
        await generateDocx('ATESTADO', ['Serviço prestado'], mockData, 'atestado_v1', true);

        expect(docx.Packer.toBlob).toHaveBeenCalled();
        expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'atestado_v1.docx');
    });

    it('deve formatar corretamente o cabeçalho com os dados da empresa', async () => {
        await generateDocx('TITULO', ['CORPO'], mockData, 'header_test');

        expect(docx.Packer.toBlob).toHaveBeenCalled();
    });
});