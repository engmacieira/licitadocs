import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header } from 'docx';
import { saveAs } from 'file-saver';

// Definição dos Placeholders aceites
export interface CompanyDocData {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cidadeUf: string;
    dataAtual: string;
    nomeRepresentante: string;
    cpfRepresentante: string;
}

// Estilos Padrão para manter o "capricho"
const styleConfig = {
    font: "Arial",
    fontSize: 22, // Equivale a tamanho 11pt no Word
    fontSizeTitle: 28, // Equivale a tamanho 14pt
    lineSpacing: 240, // 1.5 linhas
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 2.54cm (padrão ABNT)
};

export const generateDocx = async (title: string, contentBlocks: string[], data: CompanyDocData, filename: string) => {

    // Função auxiliar para substituir placeholders no texto
    const replacePlaceholders = (text: string) => {
        return text
            .replace(/\[RAZÃO SOCIAL\]/g, data.razaoSocial)
            .replace(/\[CNPJ\]/g, data.cnpj)
            .replace(/\[ENDEREÇO COMPLETO\]/g, data.endereco)
            .replace(/\[CIDADE\/UF\]/g, data.cidadeUf)
            .replace(/\[DATA\]/g, data.dataAtual)
            .replace(/\[NOME REPRESENTANTE\]/g, data.nomeRepresentante)
            .replace(/\[CPF REPRESENTANTE\]/g, data.cpfRepresentante);
    };

    // Criação do Documento
    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: styleConfig.font, size: styleConfig.fontSize },
                    paragraph: { spacing: { line: styleConfig.lineSpacing }, alignment: AlignmentType.JUSTIFIED },
                },
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: styleConfig.font, size: styleConfig.fontSizeTitle, bold: true },
                    paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER },
                }
            ]
        },
        sections: [{
            properties: { page: { margin: styleConfig.margins } },
            // Cabeçalho Bonitinho
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "LicitaDocs - Plataforma de Gestão de Documentos", bold: true, color: "777777", size: 18 }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        })
                    ],
                }),
            },
            // Conteúdo do Documento
            children: [
                // Título
                new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),

                // Espaço
                new Paragraph({ text: "" }),

                // Blocos de Conteúdo (Texto)
                ...contentBlocks.map(block => new Paragraph({
                    children: [new TextRun(replacePlaceholders(block))]
                })),

                // Espaço para assinatura
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "__________________________________________________", bold: true }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: replacePlaceholders("[RAZÃO SOCIAL]"), bold: true }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Representante Legal: ${replacePlaceholders("[NOME REPRESENTANTE]")}` }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
            ],
        }],
    });

    // Empacota e faz o download
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${filename}.docx`);
    });
};