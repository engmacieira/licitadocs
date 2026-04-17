import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { type CompanyDocData } from '../utils/docxGenerator';
import { APP_CONFIG } from '../../../config/app.config';

// Registrar Fonte Arial para garantir o padrão oficial de documentos (ABNT)
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
    // Cabeçalho de Autoridade (Substitui a Logo temporariamente)
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
        fontSize: 8,
        color: '#cbd5e1',
        fontWeight: 'bold',
        letterSpacing: 1
    },
    // Título e Corpo
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
        textTransform: 'uppercase',
        textDecoration: 'underline'
    },
    paragraph: {
        marginBottom: 12,
        textAlign: 'justify',
    },
    // Área de Assinatura (Pixel Perfect)
    signatureArea: {
        marginTop: 60,
        alignItems: 'center',
    },
    signatureLine: {
        width: '10cm',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    signatureRole: {
        fontSize: 10,
        color: '#475569',
        marginTop: 2,
    },
    // Rodapé de Rastreabilidade
    footer: {
        position: 'absolute',
        bottom: '1cm',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#f1f5f9',
        paddingTop: 10
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
 * Componente Master de Renderização de PDF.
 * Focado em conformidade legal e estética profissional.
 */
export const PDFTemplate = ({
    title,
    contentBlocks,
    companyData,
    isAttestation = false,
    customSignatureName
}: PDFTemplateProps) => (
    <Document title={title} author={APP_CONFIG.name}>
        <Page size="A4" style={styles.page}>

            {/* Cabeçalho de Identidade */}
            <View style={styles.headerContainer} fixed>
                <View style={styles.headerCompanyInfo}>
                    <Text style={styles.headerCompanyName}>{companyData.razaoSocial}</Text>
                    <Text style={styles.headerCompanyDetails}>
                        CNPJ: {companyData.cnpj} | {companyData.endereco}
                    </Text>
                </View>
                <Text style={styles.headerPlatformTag}>{APP_CONFIG.name.toUpperCase()}</Text>
            </View>

            {/* Título Oficial */}
            <Text style={styles.title}>{title}</Text>

            {/* Texto Jurídico */}
            {contentBlocks.map((block, index) => (
                <Text key={index} style={styles.paragraph}>
                    {block.replace(/\\n/g, '\n')}
                </Text>
            ))}

            {/* Bloco de Assinatura Dinâmico */}
            <View style={styles.signatureArea} wrap={false}>
                <View style={styles.signatureLine} />

                {/* Lógica de Assinatura: Se for atestado, assina o Cliente. Se for declaração, assina a Empresa. */}
                <Text style={styles.signatureName}>
                    {isAttestation ? (customSignatureName || "__________________________") : companyData.razaoSocial}
                </Text>

                <Text style={styles.signatureRole}>
                    {isAttestation ? "Assinatura do Emissor (Atestante)" : `Representante Legal: ${companyData.nomeRepresentante}`}
                </Text>

                {!isAttestation && (
                    <Text style={{ fontSize: 8, marginTop: 2 }}>CPF: {companyData.cpfRepresentante}</Text>
                )}
            </View>

            {/* Rodapé e Paginação */}
            <Text
                style={styles.footer}
                fixed
                render={({ pageNumber, totalPages }) => (
                    `Documento gerado eletronicamente via ${APP_CONFIG.name} em ${companyData.dataAtual} • Página ${pageNumber} de ${totalPages}`
                )}
            />
        </Page>
    </Document>
);
