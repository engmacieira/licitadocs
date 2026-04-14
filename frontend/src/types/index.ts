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
// ============================================================================
// 5. TIPOS DE SERVIÇOS ADICIONAIS
// ============================================================================

export interface DashboardAdminStats {
    total_companies: number;
    total_documents: number;
    total_users: number;
    recent_documents: DocumentDTO[];
    recent_companies: Company[];
}

export interface PendingAction {
    company_id: string;
    company_name: string;
    step: 'contract' | 'docs' | 'payment' | 'validation';
    date: string;
    cnpj: string;
}

export interface EmissionRuleDTO {
    id: string;
    document_type_id: string;
    document_type_name?: string;
    state?: string;
    city?: string;
    emission_link?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    operation_notes?: string;
    created_at: string;
}

export type EmissionRuleCreatePayload = Omit<EmissionRuleDTO, 'id' | 'created_at' | 'document_type_name'>;

export type EmissionRuleUpdatePayload = Partial<EmissionRuleCreatePayload>;

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

export interface MemberResponse {
    user_id: string;
    name: string | null;
    email: string;
    role: string;
    status: boolean;
    joined_at: string;
}

export interface InvitePayload {
    email: string;
    role: 'MASTER' | 'VIEWER';
}

export interface InviteResponse {
    user_id: string;
    email: string;
    role: string;
    message: string;
}

export interface RequestHistoryItem {
    id: string;
    date: Date;
    companyId: string;
    companyName: string;
    estimatedDate: string;
    status: 'pending' | 'completed';
}

export interface DocumentAutomationConfigDTO {
    is_automatable: boolean;
    strategy_name?: string | null;
    source_url?: string | null;
    requires_captcha: boolean;
    cron_schedule?: string | null;
    extra_params?: Record<string, any> | null;
}

export interface DocumentTypeDTO {
    id: string;
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    scope: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DocumentCategoryDTO {
    id: string;
    name: string;
    slug: string;
    order: number;
    types: DocumentTypeDTO[];
}

export interface DocumentDTO {
    id: string;
    filename: string;
    title?: string;
    status: string;
    expiration_date?: string;
    created_at: string;
    company_id?: string;
    company_name?: string;
    company_cnpj?: string;
    is_structured: boolean;
    type_id?: string;
    category_id?: string;
    type_name?: string;
    category_name?: string;
    authentication_code?: string;
    is_client_upload?: boolean;
}

export interface DocumentCategoryCreateDTO { name: string; slug: string; order: number; }
export interface DocumentCategoryUpdateDTO { name?: string; slug?: string; order?: number; }

export interface DocumentTypeCreateDTO {
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    category_id: string;
    scope: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DocumentTypeUpdateDTO {
    name?: string; slug?: string; validity_days_default?: number;
    description?: string; category_id?: string; scope?: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}
