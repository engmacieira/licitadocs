import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@LicitaDoc:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error("Sem conexão com o servidor", {
                description: "Verifique sua internet ou tente novamente mais tarde."
            });
        }
        else if (error.response.status === 401) {
            // UX: Sessão expirou? Limpa tudo e manda pro login.
            localStorage.removeItem('@LicitaDoc:token');
            localStorage.removeItem('@LicitaDoc:companyId');

            toast.warning("Sessão expirada", {
                description: "Por segurança, faça login novamente."
            });

            // Pequeno delay para o usuário ler o toast antes do reload
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }
        else if (error.response.status === 403) {
            // UX: Usuário tentou acessar empresa que não é dele.
            toast.error("Acesso Negado", {
                description: "Você não tem permissão para realizar esta ação ou acessar esta empresa."
            });
        }
        else if (error.response.status >= 500) {
            toast.error("Erro interno do servidor", {
                description: "Nossos engenheiros foram notificados."
            });
        }

        return Promise.reject(error);
    }
);

export default api;