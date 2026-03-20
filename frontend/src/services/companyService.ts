import api from './api';

/**
 * Interface que representa a entidade completa de uma Empresa no sistema.
 * @interface Company
 */
export interface Company {
    /** Identificador único (UUID). */
    id: string;
    /** Cadastro Nacional da Pessoa Jurídica. */
    cnpj: string;
    /** Razão Social (Mapeado no backend como 'name'). */
    razao_social: string;
    /** Nome de fachada da empresa. */
    nome_fantasia?: string;
    /** Indica se a empresa está ativa no sistema. */
    is_active: boolean;
    /** Data de criação do registo. */
    created_at: string;

    // --- Campos de Contacto e Endereço ---
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

    // --- Flags de Status e Onboarding ---
    /** Indica se o contrato SaaS foi assinado digitalmente. */
    is_contract_signed?: boolean;
    /** Indica se existe um plano de pagamento ativo. */
    is_payment_active?: boolean;
    /** Indica se a equipa administrativa já validou a empresa. */
    is_admin_verified?: boolean;
    /** Notas sobre documentos pendentes ou rejeitados. */
    pending_docs_notes?: string;
}

/**
 * Interface para os dados permitidos na atualização de uma empresa.
 * @interface CompanyUpdatePayload
 */
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

/**
 * Interface para a resposta de membros da equipa.
 * @interface MemberResponse
 */
export interface MemberResponse {
    /** Identificador único do utilizador vinculado. */
    user_id: string;
    /** Nome completo do membro. */
    name: string | null;
    /** E-mail de acesso. */
    email: string;
    /** Nível de acesso (MASTER | VIEWER). */
    role: string;
    /** Status da conta do utilizador. */
    status: boolean;
    /** Data em que o membro se juntou à equipa. */
    joined_at: string;
}

/**
 * Payload para convidar novos membros.
 * @interface InvitePayload
 */
export interface InvitePayload {
    email: string;
    role: 'MASTER' | 'VIEWER';
}

/**
 * Resposta detalhada após o envio de um convite.
 * @interface InviteResponse
 */
export interface InviteResponse {
    user_id: string;
    email: string;
    role: string;
    /** Mensagem de feedback do servidor. */
    message: string;
}

/**
 * Serviço responsável pela gestão de empresas e das suas equipas internas.
 * Concentra operações de CRUD de empresas e administração de permissões de membros.
 */
export const companyService = {
    /**
     * Recupera a lista de membros da equipa de uma empresa específica.
     * @param {string} companyId - ID da empresa.
     * @returns {Promise<MemberResponse[]>} Lista de utilizadores vinculados.
     */
    getTeam: async (companyId: string): Promise<MemberResponse[]> => {
        const { data } = await api.get<MemberResponse[]>(`/companies/${companyId}/members`);
        return data;
    },

    /**
     * Atualiza os dados cadastrais ou flags de status de uma empresa.
     * @param {string} companyId - ID da empresa a atualizar.
     * @param {CompanyUpdatePayload} payload - Objeto com os campos a alterar.
     * @returns {Promise<Company>} Objeto da empresa atualizado.
     */
    update: async (companyId: string, payload: CompanyUpdatePayload): Promise<Company> => {
        const { data } = await api.put<Company>(`/companies/${companyId}`, payload);
        return data;
    },

    /**
     * Envia um convite por e-mail para um novo membro se juntar à equipa da empresa.
     * @param {string} companyId - ID da empresa anfitriã.
     * @param {InvitePayload} payload - E-mail e cargo do convidado.
     * @returns {Promise<InviteResponse>} Dados do novo vínculo criado.
     */
    inviteMember: async (companyId: string, payload: InvitePayload): Promise<InviteResponse> => {
        const { data } = await api.post<InviteResponse>(`/companies/${companyId}/members`, payload);
        return data;
    },

    /**
     * Altera o nível de acesso (Role) de um membro existente na equipa.
     * @param {string} companyId - ID da empresa.
     * @param {string} userId - ID do utilizador a ser editado.
     * @param {string} role - Novo cargo (MASTER ou VIEWER).
     */
    updateMemberRole: async (companyId: string, userId: string, role: string) => {
        const response = await api.put(`/companies/${companyId}/members/${userId}`, { role });
        return response.data;
    },

    /**
     * Remove permanentemente o acesso de um membro à equipa da empresa.
     * @param {string} companyId - ID da empresa.
     * @param {string} userId - ID do utilizador a remover.
     */
    removeMember: async (companyId: string, userId: string) => {
        await api.delete(`/companies/${companyId}/members/${userId}`);
    },

    /**
     * Recupera a listagem global de todas as empresas (Acesso Administrativo).
     * @returns {Promise<Company[]>}
     */
    getAll: async (): Promise<Company[]> => {
        const { data } = await api.get<Company[]>('/companies');
        return data;
    },

    /**
     * Recupera os detalhes completos de uma empresa específica.
     * @param {string} id - ID da empresa.
     * @returns {Promise<Company>}
     */
    getById: async (id: string): Promise<Company> => {
        const { data } = await api.get<Company>(`/companies/${id}`);
        return data;
    },

    /**
     * Cria uma nova empresa na base de dados (Geralmente via Admin ou fluxo especial).
     * @param {Object} payload - Dados básicos da empresa.
     */
    create: async (payload: { name: string; cnpj: string }) => {
        const response = await api.post('/companies', payload);
        return response.data;
    }
};