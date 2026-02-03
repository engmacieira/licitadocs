import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Tipagem do Token Decodificado
interface User {
    sub: string;      // Email/Username
    role: string;     // 'admin' | 'client'
    exp?: number;     // Timestamp de expiração
    // Adicione outros campos se necessário (id, name, etc)
}

interface SignInCredentials {
    email: string;
    password: string;
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadedToken = localStorage.getItem('@LicitaDoc:token');

        if (loadedToken) {
            try {
                const decoded = jwtDecode<User>(loadedToken);

                // UX/Security: Verifica se o token JÁ expirou antes de logar
                // decoded.exp é em segundos, Date.now() é em ms
                const currentTime = Date.now() / 1000;

                if (decoded.exp && decoded.exp < currentTime) {
                    console.warn("🔒 Token expirado detectado na inicialização. Sessão limpa.");
                    signOut(); // Limpa tudo preventivamente
                } else {
                    // Token válido: restaura a sessão
                    setUser(decoded);
                    api.defaults.headers.common['Authorization'] = `Bearer ${loadedToken}`;
                }
            } catch (error) {
                console.error("❌ Token inválido ou corrompido:", error);
                signOut();
            }
        }

        setLoading(false);
    }, []);

    async function signIn({ email, password }: SignInCredentials) {
        // Backend espera OAuth2 form-data
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        const { access_token } = response.data;

        // 1. Salva Token
        localStorage.setItem('@LicitaDoc:token', access_token);

        // 2. Configura Axios Globalmente
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // 3. Atualiza Estado
        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);
    }

    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        setUser(null);
        // Limpa o header para não enviar token inválido em chamadas públicas
        delete api.defaults.headers.common['Authorization'];
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}