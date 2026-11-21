import api from './api';
import type { PasswordUpdatePayload, UserCompany, UserProfile } from '../types';

/**
 * Serviço responsável pela gestão de dados do utilizador e relações de conta.
 * Permite a gestão do perfil pessoal e a recuperação das empresas associadas.
 */
export const userService = {
    /**
     * Recupera a lista de todas as empresas às quais o utilizador logado tem acesso.
     * Utilizado para popular o seletor de empresas após o login.
     * @returns {Promise<UserCompany[]>} Lista de empresas vinculadas.
     */
    getMyCompanies: async (): Promise<UserCompany[]> => {
        const { data } = await api.get<UserCompany[]>('/users/me/companies');
        return data;
    },

    /**
     * Obtém os dados detalhados do perfil do próprio utilizador autenticado.
     * Serve como a "fonte da verdade" para o contexto de perfil da aplicação.
     * @returns {Promise<UserProfile>} Objeto completo do perfil.
     */
    getMe: async (): Promise<UserProfile> => {
        const { data } = await api.get<UserProfile>('/users/me');
        return data;
    },

    /**
     * Realiza a atualização parcial (PATCH) dos dados do perfil do utilizador.
     * @param {Partial<UserProfile>} userData - Objeto contendo apenas os campos a serem alterados.
     * @returns {Promise<UserProfile>} O perfil atualizado após a persistência.
     */
    updateMe: async (userData: Partial<UserProfile>): Promise<UserProfile> => {
        const { data } = await api.patch<UserProfile>('/users/me', userData);
        return data;
    },

    /**
     * Atualiza a senha do utilizador autenticado no endpoint dedicado.
     * @param {PasswordUpdatePayload} payload - Senha atual e nova senha.
     * @returns {Promise<{ message: string }>} Mensagem de confirmação.
     */
    updatePassword: async (payload: PasswordUpdatePayload): Promise<{ message: string }> => {
        const { data } = await api.patch<{ message: string }>('/users/me/password', payload);
        return data;
    }
};