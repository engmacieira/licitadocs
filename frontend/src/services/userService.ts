import api from './api';

/**
 * Interface que representa o vínculo de um utilizador com uma empresa.
 * Essencial para o seletor de empresas no login e troca de contexto.
 * @interface UserCompany
 */
export interface UserCompany {
    /** ID único da empresa. */
    id: string;
    /** Nome/Razão Social da empresa. */
    razao_social: string;
    /** Documento da empresa. */
    cnpj: string;
    /** Nível de acesso do utilizador nesta empresa específica (MASTER | VIEWER). */
    role: 'MASTER' | 'VIEWER';
    /** Indica se o vínculo está ativo. */
    status: boolean;
    /** Data em que o utilizador foi vinculado à empresa. */
    created_at: string;
}

/**
 * Interface completa do perfil do utilizador.
 * Contém os dados necessários para a geração automática de procurações e contratos.
 * @interface UserProfile
 */
export interface UserProfile {
    /** ID único do utilizador (UUID). */
    id: string;
    /** E-mail principal de acesso. */
    email: string;
    /** Indica se a conta do utilizador está habilitada. */
    is_active: boolean;
    /** Indica se o e-mail do utilizador foi verificado. */
    is_email_verified: boolean;
    /** Cargo global no sistema (admin | user). */
    role: string;

    // --- Dados Pessoais (Opcionais até ao Onboarding) ---
    /** Nome completo. */
    nome?: string;
    /** Cadastro de Pessoa Física. */
    cpf?: string;
    /** Registro Geral (Identidade). */
    rg?: string;
    /** Telemóvel/WhatsApp de contacto pessoal. */
    celular?: string;
    /** Género do utilizador. */
    genero?: string;
    /** País de origem. */
    nacionalidade?: string;
    /** Estado civil. */
    estado_civil?: string;
    /** Ocupação profissional. */
    profissao?: string;
}

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
    }
};