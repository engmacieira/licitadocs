import api from './api';
import type { Company, CompanyUpdatePayload, MemberResponse, InvitePayload, InviteResponse } from '../types';

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