import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar Fonte Arial para o PDF
Font.register({
    family: 'Arial',
    src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf'
});

const styles = StyleSheet.create({
    page: { padding: '2.54cm', fontFamily: 'Arial', fontSize: 11, lineHeight: 1.5, color: '#333' },
    header: { position: 'absolute', top: '1cm', right: '2.54cm', fontSize: 9, color: '#777' },
    footer: { position: 'absolute', bottom: '1cm', left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#999' },
    title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 20, textTransform: 'uppercase' },
    paragraph: { marginBottom: 10, textAlign: 'justify' },
    signatureArea: { marginTop: 50, alignItems: 'center' },
    signatureLine: { width: '10cm', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 },
    signatureName: { fontWeight: 'bold' }
});

/**
 * Propriedades do template de PDF.
 * @interface PDFTemplateProps
 */
interface PDFTemplateProps {
    title: string;
    contentBlocks: string[];
    customSignatureName?: string;
}

/**
 * Componente que define a estrutura visual dos PDFs gerados pela plataforma.
 * Inclui formatação ABNT, margens, cabeçalho e zona de assinatura.
 */
export const PDFTemplate = ({ title, contentBlocks, customSignatureName }: PDFTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
                <Text>LicitaDocs - Plataforma de Gestão de Documentos</Text>
            </View>

            <Text style={styles.title}>{title}</Text>

            {contentBlocks.map((block, index) => (
                <Text key={index} style={styles.paragraph}>
                    {block}
                </Text>
            ))}

            <View style={styles.signatureArea} wrap={false}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>{customSignatureName || "[RAZÃO SOCIAL]"}</Text>
                <Text>Representante Legal: [NOME REPRESENTANTE]</Text>
            </View>

            <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                `Página ${pageNumber} de ${totalPages}`
            )} fixed />
        </Page>
    </Document>
);