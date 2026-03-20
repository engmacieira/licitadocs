import api from './api';

/**
 * Interface que representa as credenciais necessárias para autenticação de utilizadores.
 * @interface SignInCredentials
 */
export interface SignInCredentials {
    /** E-mail do utilizador (mapeado para 'username' no fluxo OAuth2). */
    email: string;
    /** Palavra-passe do utilizador. */
    password: string;
}

/**
 * Interface que representa a resposta de sucesso emitida pelo servidor de autenticação.
 * @interface AuthResponse
 */
export interface AuthResponse {
    /** Token de acesso JWT (JSON Web Token). */
    access_token: string;
    /** Tipo do token (ex: 'bearer'). */
    token_type: string;
}

/**
 * Serviço responsável por gerir o ciclo de vida da autenticação e registo.
 * Implementa os protocolos OAuth2 e suporta submissões multipart para uploads de ficheiros.
 */
export const authService = {
    /**
     * Realiza a autenticação do utilizador seguindo o padrão OAuth2 Password Grant.
     * Converte os dados para o formato 'application/x-www-form-urlencoded' exigido pelo FastAPI/OAuth2.
     * * @param {SignInCredentials} credentials - Objeto com e-mail e palavra-passe.
     * @returns {Promise<AuthResponse>} Objeto contendo o access_token para futuras requisições.
     */
    signIn: async ({ email, password }: SignInCredentials): Promise<AuthResponse> => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const { data } = await api.post<AuthResponse>('/auth/token', formData);
        return data;
    },

    /**
     * Realiza o registo de uma nova empresa e do seu administrador inicial.
     * Como o registo exige o envio de documentos (ex: Contrato Social), este método
     * utiliza 'multipart/form-data' para agrupar campos de texto e ficheiros binários.
     * * @param {FormData} registerData - Objeto FormData contendo dados cadastrais e ficheiros.
     * @returns {Promise<void>}
     */
    register: async (registerData: FormData): Promise<void> => {
        await api.post('/auth/register', registerData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};