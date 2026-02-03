import axios from 'axios';
import { toast } from 'sonner';

// 🎯 Padrão Correto: Usa o Proxy do Vite (/api -> :8000)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // UX: 10s de timeout para não deixar a tela travada eternamente
});

// Interceptor: Garante que o token vai em TODAS as requisições
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
        // UX: Tratamento Global de Erros (A Rede de Segurança)

        if (!error.response) {
            // Erro de Rede (Internet caiu ou API offline)
            toast.error("Sem conexão com o servidor", {
                description: "Verifique sua internet ou tente novamente mais tarde."
            });
        }
        else if (error.response.status === 401) {
            // Token expirou ou inválido
            toast.warning("Sessão expirada", {
                description: "Por favor, faça login novamente."
            });
            // Opcional: localStorage.removeItem('@LicitaDoc:token');
            // Opcional: window.location.href = '/'; 
        }
        else if (error.response.status >= 500) {
            // Erro no Servidor (Bug no Backend)
            toast.error("Erro interno do servidor", {
                description: "Nossos engenheiros foram notificados. Tente novamente."
            });
        }
        // Nota: Erros 400/422 (Validação) deixamos passar para o componente tratar especificamente

        return Promise.reject(error);
    }
);

export default api;