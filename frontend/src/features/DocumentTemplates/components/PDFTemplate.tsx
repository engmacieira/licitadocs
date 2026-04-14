import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { type CompanyDocData } from '../utils/docxGenerator';

// Registrar Fonte Arial para garantir o padrão oficial de documentos
Font.register({
    family: 'Arial',
    src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: '2.54cm',
        fontFamily: 'Arial',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#1a1a1a'
    },
    // Cabeçalho de Autoridade (US-3004)
    headerContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 10,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    headerCompanyInfo: {
        flexDirection: 'column',
    },
    headerCompanyName: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#0f172a'
    },
    headerCompanyDetails: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 2
    },
    headerPlatformTag: {
        fontSize: 7,
        color: '#94a3b8',
        textAlign: 'right'
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        textTransform: 'uppercase',
        color: '#000'
    },
    paragraph: {
        marginBottom: 12,
        textAlign: 'justify',
        textIndent: 40 // Recuo de parágrafo oficial
    },
    // Zona de Respiro para Assinatura (Affordance Física)
    signatureArea: {
        marginTop: 60, // 3-4cm de respiro conforme plano de ataque
        alignItems: 'center',
        flexDirection: 'column'
    },
    signatureLine: {
        width: '10cm',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 8
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    signatureRole: {
        fontSize: 10,
        color: '#475569'
    },
    footer: {
        position: 'absolute',
        bottom: '1cm',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8'
    }
});

interface PDFTemplateProps {
    title: string;
    contentBlocks: string[];
    companyData: CompanyDocData;
    isAttestation?: boolean;
    customSignatureName?: string;
}

/**
 * PDFTemplate - Motor de Renderização Oficial (Sprint 30)
 * Responsável por gerar o visual final do documento.
 * Aplica lógica condicional para cabeçalhos e assinaturas.
 */
export const PDFTemplate = ({
    title,
    contentBlocks,
    companyData,
    isAttestation = false,
    customSignatureName
}: PDFTemplateProps) => (
    <Document title={title}>
        <Page size="A4" style={styles.page}>

            {/* Cabeçalho Dinâmico: Só exibe timbre se NÃO for atestado (Regra de UX) */}
            {!isAttestation && (
                <View style={styles.headerContainer}>
                    <View style={styles.headerCompanyInfo}>
                        <Text style={styles.headerCompanyName}>{companyData.razaoSocial}</Text>
                        <Text style={styles.headerCompanyDetails}>
                            CNPJ: {companyData.cnpj} | {companyData.endereco}
                        </Text>
                    </View>
                    <Text style={styles.headerPlatformTag}>LicitaDocs</Text>
                </View>
            )}

            {/* Título do Documento */}
            <Text style={styles.title}>{title}</Text>

            {/* Corpo do Texto Injetado */}
            {contentBlocks.map((block, index) => (
                <Text key={index} style={styles.paragraph}>
                    {block}
                </Text>
            ))}

            {/* Área de Assinatura com Contexto de Emissor */}
            <View style={styles.signatureArea} wrap={false}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>
                    {isAttestation ? (customSignatureName || "__________________________") : companyData.razaoSocial}
                </Text>
                <Text style={styles.signatureRole}>
                    {isAttestation ? "Assinatura do Emissor" : `Representante Legal: ${companyData.nomeRepresentante}`}
                </Text>
            </View>

            {/* Rodapé de Rastreabilidade */}
            <Text
                style={styles.footer}
                fixed
                render={({ pageNumber, totalPages }) => (
                    `Documento gerado via LicitaDocs em ${companyData.dataAtual} - Página ${pageNumber} de ${totalPages}`
                )}
            />
        </Page>
    </Document>
);