import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    Header,
    Footer,
    BorderStyle,
    PageNumber
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Interface que define a estrutura de dados necessária para injetar 
 * informações dinâmicas nos modelos de documentos.
 */
export interface CompanyDocData {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cidadeUf: string;
    dataAtual: string;
    nomeRepresentante: string;
    cpfRepresentante: string;
}

// Estilos Padrão para manter o "capricho" e as normas ABNT (Pixel Perfect)
const styleConfig = {
    font: "Arial",
    fontSize: 22, // 11pt
    fontSizeTitle: 28, // 14pt
    fontSizeHeader: 16, // 8pt
    lineSpacing: 240, // 1.5
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 2.54cm
};

/**
 * Gera e transfere um ficheiro .docx formatado.
 * @param title O título centralizado do documento.
 * @param contentBlocks Array de parágrafos de texto.
 * @param data O objeto com os dados da empresa.
 * @param filename O nome base do ficheiro.
 * @param isAttestation Flag opcional para documentos de terceiros (Sprint 30).
 */
export const generateDocx = (
    title: string,
    contentBlocks: string[],
    data: CompanyDocData,
    filename: string,
    isAttestation: boolean = false
) => {

    // Função auxiliar para criar parágrafos padrão (UX: consistência de espaçamento)
    const createParagraph = (text: string, options: any = {}) => {
        return new Paragraph({
            spacing: { line: styleConfig.lineSpacing, before: 120, after: 120 },
            alignment: options.alignment || AlignmentType.JUSTIFIED,
            children: [
                new TextRun({
                    text: text,
                    font: styleConfig.font,
                    size: styleConfig.fontSize,
                    ...options.textOptions
                }),
            ],
        });
    };

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: styleConfig.margins,
                },
            },
            // Cabeçalho de Autoridade (US-3004) - Só aparece em Declarações Próprias
            headers: {
                default: new Header({
                    children: isAttestation ? [] : [
                        new Paragraph({
                            border: {
                                bottom: { color: "E2E8F0", space: 1, style: BorderStyle.SINGLE, size: 6 },
                            },
                            children: [
                                new TextRun({
                                    text: data.razaoSocial.toUpperCase(),
                                    bold: true,
                                    font: styleConfig.font,
                                    size: 18, // 9pt
                                }),
                                new TextRun({
                                    text: `\nCNPJ: ${data.cnpj} | ${data.endereco}`,
                                    font: styleConfig.font,
                                    size: styleConfig.fontSizeHeader,
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: `Documento gerado via LicitaDocs em ${data.dataAtual} - Página `,
                                    font: styleConfig.font,
                                    size: 14,
                                }),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: styleConfig.font,
                                    size: 14,
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                // Título
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 240, after: 480 },
                    children: [
                        new TextRun({
                            text: title.toUpperCase(),
                            bold: true,
                            font: styleConfig.font,
                            size: styleConfig.fontSizeTitle,
                        }),
                    ],
                }),

                // Blocos de Conteúdo
                ...contentBlocks.map(block => createParagraph(block)),

                // Zona de Respiro para Assinatura (Affordance Física)
                new Paragraph({ text: "", spacing: { before: 800 } }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "__________________________________________________", bold: true }),
                    ],
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 120 },
                    children: [
                        new TextRun({
                            text: isAttestation ? "[NOME DO EMISSOR PARA ASSINATURA]" : data.razaoSocial.toUpperCase(),
                            bold: true,
                            font: styleConfig.font,
                            size: styleConfig.fontSize
                        }),
                    ],
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: isAttestation ? "Carimbo e Assinatura" : `Representante Legal: ${data.nomeRepresentante}`,
                            font: styleConfig.font,
                            size: styleConfig.fontSize - 2 // 10pt
                        }),
                    ],
                }),
            ],
        }],
    });

    // Empacota e faz o download
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${filename}.docx`);
    });
};