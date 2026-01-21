import axios from 'axios';

// 🎯 Padrão Correto: Usa o Proxy do Vite (/api -> :8000)
const api = axios.create({
    baseURL: '/api',
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
        // Se der erro 401 (Sessão Inválida), podemos deslogar futuramente
        if (error.response && error.response.status === 401) {
            console.warn("⚠️ Sessão expirada ou token inválido.");
        }
        return Promise.reject(error);
    }
);

export default api;