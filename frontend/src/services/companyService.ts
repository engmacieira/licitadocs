import api from './api';

// --- INTERFACES ---

export interface Company {
    id: string;
    name: string;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    is_active: boolean;
    created_at: string;

    // [NOVOS CAMPOS] Para a tela de Configurações da Empresa
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
}

// Interface para criar (Admin)
export interface CompanyCreate {
    name: string;
    cnpj: string;
    razao_social?: string; // Adicionado para compatibilidade
    nome_fantasia?: string;
}

// [NOVO] Interface para a própria empresa se atualizar (Tenant)
export interface CompanyUpdatePayload {
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
}

export interface CompanyDocument {
    id: string;
    filename: string;
    created_at: string;
    status: string;
    title?: string; // Já estava correto no seu arquivo
}

export interface MemberInvite {
    email: string;
    role: 'MASTER' | 'VIEWER';
    name?: string;
    cpf?: string;
}

export interface MemberResponse {
    user_id: string;
    email: string;
    role: string;
    status: boolean;
    joined_at: string;
    name?: string;
}

export const companyService = {
    // --- MÉTODOS DE ADMINISTRAÇÃO (Mantidos do seu arquivo) ---
    getAll: async () => {
        const response = await api.get<Company[]>('/admin/companies/');
        return response.data;
    },

    create: async (data: CompanyCreate) => {
        const response = await api.post('/admin/companies/', data);
        return response.data;
    },

    // Atualização pelo Admin
    update: async (id: string, data: Partial<CompanyCreate>) => {
        const response = await api.put(`/admin/companies/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/admin/companies/${id}`);
    },

    toggleStatus: async (id: string) => {
        const response = await api.patch(`/admin/companies/${id}/toggle-status`);
        return response.data;
    },

    // --- MÉTODOS DO TENANT / COMPARTILHADOS ---

    // [ATUALIZADO] GetById agora tenta buscar na rota pública/tenant primeiro
    // Se falhar (ex: admin tentando ver), ele poderia tentar /admin/companies/{id}
    // Mas vamos manter simples apontando para a rota de tenant que deve retornar os dados se o user for membro
    getById: async (id: string) => {
        const response = await api.get<Company>(`/companies/${id}`);
        return response.data;
    },

    // [NOVO] Método para a empresa atualizar seus próprios dados (Endereço, etc)
    updateSelf: async (companyId: string, data: CompanyUpdatePayload) => {
        const response = await api.put(`/companies/${companyId}`, data);
        return response.data;
    },

    // Listar Membros da Equipe (Mantido)
    getTeam: async (companyId: string) => {
        const response = await api.get<MemberResponse[]>(`/companies/${companyId}/members`);
        return response.data;
    },

    // Convidar Membro (Mantido)
    inviteMember: async (companyId: string, data: MemberInvite) => {
        const response = await api.post(`/companies/${companyId}/members`, data);
        return response.data;
    },

    // Listar Documentos (Mantido)
    getDocuments: async (companyId: string) => {
        const response = await api.get<CompanyDocument[]>(`/documents/?company_id=${companyId}`);
        return response.data;
    },

    // Download Seguro (Mantido)
    downloadDocument: async (docId: string, filename: string) => {
        const response = await api.get(`/documents/${docId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};