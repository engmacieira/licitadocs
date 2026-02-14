import api from './api';

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export const authService = {
    // Login seguindo o padrão OAuth2 (form-urlencoded)
    signIn: async ({ email, password }: SignInCredentials): Promise<AuthResponse> => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const { data } = await api.post<AuthResponse>('/auth/token', formData);
        return data;
    },

    // Registro com Upload de Arquivos (Multipart)
    // Recebe FormData diretamente para flexibilidade com arquivos
    register: async (registerData: FormData): Promise<void> => {
        await api.post('/auth/register', registerData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};