import type { DocumentDTO } from '../services/documentService';

// As categorias exatas que você definiu
export type VaultCategory =
    | 'Habilitação Jurídica'
    | 'Regularidade Fiscal e Trabalhista'
    | 'Qualificação Econômico-Financeira'
    | 'Qualificação Técnica'
    | 'Declarações'
    | 'Outros Documentos';

export interface CategorizedData {
    valid: DocumentDTO[];
    expired: DocumentDTO[];
}

export interface VaultStructure {
    [key: string]: CategorizedData;
}

export const categorizeDocuments = (documents: DocumentDTO[]): VaultStructure => {
    // Inicializa a estrutura para garantir a ordem de exibição na tela
    const structure: VaultStructure = {
        'Habilitação Jurídica': { valid: [], expired: [] },
        'Regularidade Fiscal e Trabalhista': { valid: [], expired: [] },
        'Qualificação Econômico-Financeira': { valid: [], expired: [] },
        'Qualificação Técnica': { valid: [], expired: [] },
        'Declarações': { valid: [], expired: [] },
        'Outros Documentos': { valid: [], expired: [] },
    };

    documents.forEach(doc => {
        // Normaliza para caixa baixa para facilitar a busca
        const term = (doc.title || doc.filename).toLowerCase();
        const category = identifyCategory(term);

        // Separa por status (Vigente vs Histórico)
        // Consideramos 'valid' e 'warning' (vencendo) como visíveis, 'expired' como histórico
        if (doc.status === 'expired') {
            structure[category].expired.push(doc);
        } else {
            structure[category].valid.push(doc);
        }
    });

    return structure;
};

// A "Inteligência" temporária do Frontend
function identifyCategory(term: string): VaultCategory {
    // 1. Habilitação Jurídica
    if (term.includes('contrato social') || term.includes('estatuto') || term.includes('ato constitutivo') || term.includes('cartão cnpj') || term.includes('requerimento de empresário'))
        return 'Habilitação Jurídica';

    // 2. Regularidade Fiscal e Trabalhista (Ajustei Cartão CNPJ aqui ou acima? Geralmente CNPJ é Jurídica, mas as vezes pedem em fiscal. Vou deixar na Jurídica conforme padrão, mas se quiser mudo).
    // Nota: Movi 'Cartão CNPJ' para Jurídica acima, mas se preferir em Fiscal:
    if (
        term.includes('municipal') ||
        term.includes('estadual') ||
        term.includes('federal') ||
        term.includes('união') ||
        term.includes('fgts') ||
        term.includes('trabalhista') ||
        term.includes('cnd') ||
        term.includes('inss') ||
        term.includes('dívida ativa')
    ) return 'Regularidade Fiscal e Trabalhista';

    // 3. Qualificação Econômico-Financeira
    if (term.includes('balanço') || term.includes('falência') || term.includes('concordata') || term.includes('patrimonial') || term.includes('indices') || term.includes('contábil'))
        return 'Qualificação Econômico-Financeira';

    // 4. Qualificação Técnica (Engloba Operacional e Profissional por enquanto)
    if (term.includes('atestado') || term.includes('crea') || term.includes('cau') || term.includes('acervo') || term.includes('cat') || term.includes('capacidade'))
        return 'Qualificação Técnica';

    // 5. Declarações
    if (term.includes('declaração') || term.includes('cumprimento') || term.includes('sustentabilidade') || term.includes('menor'))
        return 'Declarações';

    return 'Outros Documentos';
}