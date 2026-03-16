import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Imports dos Serviços (Clean Architecture)
import { authService } from '../services/authService';
import type { SignInCredentials } from '../services/authService';
import { userService } from '../services/userService';
// IMPORTANTE: Importamos o UserProfile aqui também!
import type { UserCompany, UserProfile } from '../services/userService';

// Interface do Token Decodificado (Payload do JWT)
interface User {
    sub: string;
    role: string;
    id: string;
    user_id: string;
    exp?: number;
}

interface AuthContextData {
    user: User | null;
    userProfile: UserProfile | null; // <-- NOVO: Guardará os dados completos do banco!
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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // <-- NOVO ESTADO
    const [companies, setCompanies] = useState<UserCompany[]>([]);
    const [currentCompany, setCurrentCompany] = useState<UserCompany | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Carrega as empresas do usuário e o PERFIL COMPLETO.
     */
    const loadUserContext = useCallback(async () => {
        try {
            // 1. Busca os dados completos da pessoa (CPF, RG, Nacionalidade, etc)
            const profile = await userService.getMe();
            setUserProfile(profile);

            // 2. Busca as empresas
            const myCompanies = await userService.getMyCompanies();
            setCompanies(myCompanies);

            // Lógica de Seleção Automática de Empresa
            if (myCompanies.length > 0) {
                const lastCompanyId = localStorage.getItem('@LicitaDoc:companyId');
                const target = myCompanies.find(c => c.id === lastCompanyId) || myCompanies[0];

                setCurrentCompany(prev => (prev?.id === target.id ? prev : target));
                localStorage.setItem('@LicitaDoc:companyId', target.id);
            }
        } catch (error) {
            console.error("AuthContext: Falha ao carregar contexto do usuário", error);
        }
    }, []);

    /**
     * Efeito Inicial: Restaura a sessão ao recarregar a página.
     */
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
                    loadUserContext();
                }
            } catch (error) {
                signOut();
            }
        } else {
            setLoading(false);
        }
    }, [loadUserContext]);

    // O useEffect acima precisa garantir que o loading termine após o fluxo
    useEffect(() => {
        if (user || !localStorage.getItem('@LicitaDoc:token')) {
            setLoading(false);
        }
    }, [user]);

    /**
     * Realiza o Login delegando para o authService.
     */
    async function signIn(credentials: SignInCredentials) {
        const response = await authService.signIn(credentials);
        const { access_token } = response;

        localStorage.setItem('@LicitaDoc:token', access_token);

        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);

        await loadUserContext();
    }

    /**
     * Limpa a sessão completamente.
     */
    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        localStorage.removeItem('@LicitaDoc:companyId');
        setUser(null);
        setUserProfile(null); // <-- Limpa o perfil na saída
        setCompanies([]);
        setCurrentCompany(null);
    }

    /**
     * Troca a empresa ativa (Tenant Switch).
     */
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
            userProfile, // <-- Exportando para usar nas telas!
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