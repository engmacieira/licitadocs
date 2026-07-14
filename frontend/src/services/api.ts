import axios from 'axios';
import { toast } from 'sonner';

/** URL base para as requisições, priorizando variáveis de ambiente. */
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/** * Instância central do Axios configurada com timeout e baseURL.
 * Utilizada por todos os serviços da aplicação para garantir consistência.
 */
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

/**
 * Interceptor de Requisição:
 * Injeta automaticamente o Token de Autenticação (JWT) no cabeçalho
 * de todas as saídas, caso o usuário esteja logado.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@LicitaDoc:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Interceptor de Resposta:
 * Gerenciador global de erros e UX de rede. Trata sessões expiradas,
 * quedas de conexão e erros internos do servidor com feedback visual (Toasts).
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error("Sem conexão com o servidor", {
                description: "Verifique a sua internet ou tente novamente mais tarde."
            });
        }
        else if (error.response.status === 401) {
            // Tratamento de Sessão Expirada: Limpa o estado local
            localStorage.removeItem('@LicitaDoc:token');
            localStorage.removeItem('@LicitaDoc:companyId');

            // ARRAY DE ROTAS PÚBLICAS (Onde não queremos forçar o redirecionamento)
            const publicPaths = ['/', '/login', '/register', '/demonstracao', '/sobre', '/contract-sign', '/payment', '/forgot-password', '/reset-password', '/verify-email'];
            const currentPath = window.location.pathname;

            // Só redireciona e mostra o popup se o utilizador tentar aceder a uma ROTA PROTEGIDA
            if (!publicPaths.includes(currentPath)) {
                toast.warning("Sessão expirada", {
                    description: "Por segurança, faça login novamente."
                });

                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
            // NOTA: Se for rota pública (como o Em Breve), morre silenciosamente e deixa o utilizador na página.
        }
        else if (error.response.status === 403) {
            toast.error("Acesso Negado", {
                description: "Não tem permissão para realizar esta ação."
            });
        }
        else if (error.response.status >= 500) {
            toast.error("Erro interno do servidor", {
                description: "A nossa equipa técnica foi notificada do incidente."
            });
        }

        return Promise.reject(error);
    }
);

export default api;