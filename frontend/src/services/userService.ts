import api from './api';

export interface UserCompany {
    id: string;
    razao_social: string;
    cnpj: string;
    role: 'MASTER' | 'VIEWER';
    status: boolean;
    created_at: string;
}

export const userService = {
    // Busca todas as empresas que o usuário tem acesso
    getMyCompanies: async () => {
        const response = await api.get<UserCompany[]>('/users/me/companies');
        return response.data;
    },

    // Busca dados do perfil (caso precise recarregar)
    getMe: async () => {
        const response = await api.get('/users/me');
        return response.data;
    }
};