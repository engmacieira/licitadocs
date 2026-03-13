import api from './api';

export interface UserCompany {
    id: string;
    razao_social: string;
    cnpj: string;
    role: 'MASTER' | 'VIEWER';
    status: boolean;
    created_at: string;
}

// Interface base para o perfil (Adicione os campos exatos do seu UserSchema aqui)
export interface UserProfile {
    id: string;
    email: string;
    is_active: boolean;
    role: string;
    nome?: string;
    cpf?: string;
    rg?: string;
    celular?: string;
    genero?: string;
    nacionalidade?: string;
    estado_civil?: string;
    profissao?: string;
}

export const userService = {
    /**
     * Busca todas as empresas vinculadas ao usuário logado.
     */
    getMyCompanies: async (): Promise<UserCompany[]> => {
        const { data } = await api.get<UserCompany[]>('/users/me/companies');
        return data;
    },

    /**
     * Busca os dados completos do perfil do usuário atual.
     */
    getMe: async (): Promise<UserProfile> => {
        const { data } = await api.get<UserProfile>('/users/me');
        return data;
    },

    /**
     * Atualiza os dados do perfil do usuário atual.
     */
    updateMe: async (userData: Partial<UserProfile>): Promise<UserProfile> => {
        const { data } = await api.patch<UserProfile>('/users/me', userData);
        return data;
    }
};