// ============================================================================
// 1. TIPOS DE NEGÓCIO (ENTIDADES PRINCIPAIS)
// ============================================================================

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
}

/** Perfil completo do utilizador autenticado. */
export interface UserProfile {
    id: string;
    email: string;
    is_active: boolean;
    is_email_verified: boolean;
    role: string;
    nome_completo?: string;
    cpf?: string;
    cargo_profissao?: string;
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

// ============================================================================
// 2. TIPOS DE DOCUMENTOS E GERAÇÃO (FOCO SPRINT 30)
// ============================================================================

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

export type DocumentScope = "NATIONAL" | "STATE" | "MUNICIPAL";

// ============================================================================
// 3. TIPOS DE AUTENTICAÇÃO E COMUNICAÇÃO
// ============================================================================

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface ChatResponse {
    response: string;
}

// ============================================================================
// 4. ESTATÍSTICAS E DASHBOARD
// ============================================================================

export interface AdminStats {
    total_companies: number;
    active_companies: number;
    pending_approval: number;
    documents_generated_month: number;
}

export interface ClientStats {
    company_name: string;
    total_docs: number;
    docs_valid: number;
    docs_expired: number;
    is_contract_signed: boolean;
    is_payment_active: boolean;
    is_admin_verified: boolean;
}