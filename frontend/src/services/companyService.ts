import api from './api';

// --- INTERFACES (Alinhadas com company_schemas.py) ---

// Interface completa da Empresa (Visualização)
export interface Company {
    id: string;
    cnpj: string;
    razao_social: string; // O backend envia 'name' alias 'razao_social'
    nome_fantasia?: string;
    is_active: boolean;
    created_at: string;

    // Campos de Contato/Endereço
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

    // Campos de Status (Sprint 15)
    is_contract_signed?: boolean;
    is_payment_active?: boolean;
    status?: boolean; // Algumas rotas retornam status ao invés de is_active
}

// Payload para Atualização (PUT)
export interface CompanyUpdatePayload {
    razao_social?: string; // Backend aceita alias
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
}

// Resposta da lista de membros (GET /members)
export interface MemberResponse {
    user_id: string; // Backend retorna user_id, não id
    name: string | null;
    email: string;
    role: string;
    status: boolean;
    joined_at: string;
}

// Payload para convite (POST /members)
export interface InvitePayload {
    email: string;
    role: 'MASTER' | 'VIEWER';
}

// Resposta do convite (POST /members)
export interface InviteResponse {
    user_id: string;
    email: string;
    role: string;
    message: string; // Importante para feedback
}

export const companyService = {
    // Buscar membros da equipe
    getTeam: async (companyId: string): Promise<MemberResponse[]> => {
        const { data } = await api.get<MemberResponse[]>(`/companies/${companyId}/members`);
        return data;
    },

    // Atualizar dados da empresa (Corrigido de updateSelf para update)
    update: async (companyId: string, payload: CompanyUpdatePayload): Promise<Company> => {
        const { data } = await api.put<Company>(`/companies/${companyId}`, payload);
        return data;
    },

    // Convidar membro
    inviteMember: async (companyId: string, payload: InvitePayload): Promise<InviteResponse> => {
        const { data } = await api.post<InviteResponse>(`/companies/${companyId}/members`, payload);
        return data;
    },

    // (Opcional) Métodos mantidos se você usar em outros lugares
    getAll: async (): Promise<Company[]> => {
        const { data } = await api.get<Company[]>('/companies');
        return data;
    },
    getById: async (id: string): Promise<Company> => {
        const { data } = await api.get<Company>(`/companies/${id}`);
        return data;
    }
};