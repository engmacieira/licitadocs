import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Tipagem dos dados do Usuário (o que vem dentro do Token)
interface User {
    sub: string; // Email
    role: string; // 'admin' ou 'client'
    // Adicione outros campos se o seu backend colocar no token
}

// Tipagem das credenciais de login
interface SignInCredentials {
    email: string;
    password: string;
}

// Tipagem do Contexto (o que fica disponível para o app)
interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    loading: boolean;
}

// Criação do Contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ao carregar a página, verifica se já tem token salvo
        const loadedToken = localStorage.getItem('@LicitaDoc:token');

        if (loadedToken) {
            try {
                // Decodifica o token para recuperar os dados do usuário
                const decoded = jwtDecode<User>(loadedToken);
                setUser(decoded);
                // Atualiza o header do axios para garantir que requisições tenham o token
                api.defaults.headers.common['Authorization'] = `Bearer ${loadedToken}`;
            } catch (error) {
                // Se o token for inválido (ex: expirou), limpa tudo
                signOut();
            }
        }

        setLoading(false);
    }, []);

    async function signIn({ email, password }: SignInCredentials) {
        // 1. Chama o Backend
        // O backend espera Content-Type: application/x-www-form-urlencoded para OAuth2
        // Vamos usar URLSearchParams para formatar os dados corretamente
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI OAuth2 espera 'username', não 'email'
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);

        const { access_token } = response.data;

        // 2. Salva no navegador
        localStorage.setItem('@LicitaDoc:token', access_token);

        // 3. Atualiza o Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // 4. Decodifica e atualiza o estado
        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);
    }

    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para facilitar o uso
export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}