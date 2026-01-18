import axios from 'axios';

// 1. Cria a instância do Axios com o endereço base do Python
const api = axios.create({
    baseURL: 'http://localhost:8000', // Certifique-se que seu backend roda aqui
});

// 2. Interceptor de Requisição (Request)
// Antes de sair do navegador, o Axios executa essa função
api.interceptors.request.use((config) => {
    // Tenta pegar o token salvo no LocalStorage
    const token = localStorage.getItem('@LicitaDoc:token');

    // Se tiver token, adiciona no cabeçalho Authorization
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// 3. (Opcional) Interceptor de Resposta para tratar erros globais
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se o backend retornar 401 (Não autorizado), significa que o token venceu ou é inválido
        if (error.response && error.response.status === 401) {
            // Opcional: Deslogar o usuário automaticamente se o token expirar
            // localStorage.removeItem('@LicitaDoc:token');
        }
        return Promise.reject(error);
    }
);

export default api;