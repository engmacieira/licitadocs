import axios from 'axios';

// O Vite vai pegar isso e jogar no túnel que configuramos acima.
const api = axios.create({
    baseURL: '/api',
});

// Interceptor de Requisição 
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@LicitaDoc:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de Resposta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Opcional: localStorage.removeItem('@LicitaDoc:token');
        }
        return Promise.reject(error);
    }
);

export default api;