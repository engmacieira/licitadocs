/** Representa a entidade completa de uma Empresa no LicitaDocs. */
export interface Company {
    id: string;
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    is_active: boolean;
    created_at: string;
    email_corporativo?: string;
    telefone?: string;
    responsavel_nome?: string;
    responsavel_cpf?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    is_contract_signed?: boolean;
    is_payment_active?: boolean;
    is_admin_verified?: boolean;
    pending_docs_notes?: string;
}

/** Vínculo de um utilizador com uma empresa específica. */
export interface UserCompany {
    id: string;
    razao_social: string;
    cnpj: string;
    role: 'MASTER' | 'VIEWER';
    status: boolean;
    created_at: string;
}

/** * [US-3004] Dados necessários para injetar nos motores de DOCX e PDF.
 * Unifica o que o sistema tem com o que o documento exige.
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

export interface CompanyUpdatePayload {
    razao_social?: string;
    nome_fantasia?: string;
    email_corporativo?: string;
    telefone?: string;
    responsavel_nome?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    is_admin_verified?: boolean;
    is_contract_signed?: boolean;
    is_payment_active?: boolean;
    pending_docs_notes?: string;
}
