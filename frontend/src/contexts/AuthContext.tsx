import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { userService } from '../services/userService';
import type { UserCompany } from '../services/userService';
import { jwtDecode } from 'jwt-decode';

interface User {
    sub: string;
    role: string;
    user_id: string;
    exp?: number;
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

    // Multi-Tenancy
    companies: UserCompany[];
    currentCompany: UserCompany | null;
    switchCompany: (companyId: string) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<UserCompany[]>([]);
    const [currentCompany, setCurrentCompany] = useState<UserCompany | null>(null);
    const [loading, setLoading] = useState(true);

    // Carrega empresas e seleciona a ativa
    async function loadUserContext() {
        try {
            const myCompanies = await userService.getMyCompanies();
            setCompanies(myCompanies);

            // Se tiver empresas e nenhuma selecionada
            if (myCompanies.length > 0 && !currentCompany) {
                // Tenta recuperar a última usada ou pega a primeira
                const lastCompanyId = localStorage.getItem('@LicitaDoc:companyId');
                const target = myCompanies.find(c => c.id === lastCompanyId) || myCompanies[0];

                setCurrentCompany(target);
                localStorage.setItem('@LicitaDoc:companyId', target.id);
            }
        } catch (error) {
            console.error("Falha ao carregar contexto do usuário", error);
        }
    }

    useEffect(() => {
        const loadedToken = localStorage.getItem('@LicitaDoc:token');

        if (loadedToken) {
            try {
                const decoded = jwtDecode<User>(loadedToken);
                const currentTime = Date.now() / 1000;

                if (decoded.exp && decoded.exp < currentTime) {
                    signOut();
                } else {
                    setUser(decoded);
                    api.defaults.headers.common['Authorization'] = `Bearer ${loadedToken}`;
                    loadUserContext(); // Restaura contexto ao recarregar página
                }
            } catch (error) {
                signOut();
            }
        }

        setLoading(false);
    }, []);

    async function signIn({ email, password }: SignInCredentials) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        // [MUDANÇA] Rota /auth/token (OAuth2 Padrão)
        const response = await api.post('/auth/token', formData);
        const { access_token } = response.data;

        localStorage.setItem('@LicitaDoc:token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);

        await loadUserContext(); // Carrega empresas logo após login
    }

    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        localStorage.removeItem('@LicitaDoc:companyId');
        setUser(null);
        setCompanies([]);
        setCurrentCompany(null);
        delete api.defaults.headers.common['Authorization'];
    }

    function switchCompany(companyId: string) {
        const target = companies.find(c => c.id === companyId);
        if (target) {
            setCurrentCompany(target);
            localStorage.setItem('@LicitaDoc:companyId', target.id);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            signIn,
            signOut,
            loading,
            companies,
            currentCompany,
            switchCompany
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}