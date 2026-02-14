import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Imports dos Serviços (Clean Architecture)
import { authService } from '../services/authService';
import type { SignInCredentials } from '../services/authService';
import { userService } from '../services/userService';
import type { UserCompany } from '../services/userService';

// Interface do Token Decodificado (Payload do JWT)
interface User {
    sub: string;
    role: string;
    user_id: string;
    exp?: number;
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

    /**
     * Carrega as empresas do usuário e define a empresa ativa.
     * Usamos useCallback para garantir estabilidade nas dependências do useEffect.
     */
    const loadUserContext = useCallback(async () => {
        try {
            const myCompanies = await userService.getMyCompanies();
            setCompanies(myCompanies);

            // Lógica de Seleção Automática de Empresa
            if (myCompanies.length > 0) {
                // Tenta recuperar a última usada do storage ou pega a primeira da lista
                const lastCompanyId = localStorage.getItem('@LicitaDoc:companyId');
                const target = myCompanies.find(c => c.id === lastCompanyId) || myCompanies[0];

                // Só atualiza se for diferente da atual para evitar renders desnecessários
                setCurrentCompany(prev => (prev?.id === target.id ? prev : target));

                // Garante que o storage esteja sincronizado
                localStorage.setItem('@LicitaDoc:companyId', target.id);
            }
        } catch (error) {
            console.error("AuthContext: Falha ao carregar contexto do usuário", error);
            // Nota: Não chamamos signOut() aqui para evitar loop de logout em caso de erro temporário de rede
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

                // Verifica se o token ainda é válido
                if (decoded.exp && decoded.exp < currentTime) {
                    signOut();
                } else {
                    setUser(decoded);
                    // O Interceptor do api.ts já vai pegar o token do localStorage,
                    // então podemos chamar loadUserContext direto.
                    loadUserContext();
                }
            } catch (error) {
                // Token inválido ou corrompido
                signOut();
            }
        }

        setLoading(false);
    }, [loadUserContext]);

    /**
     * Realiza o Login delegando para o authService.
     */
    async function signIn(credentials: SignInCredentials) {
        // 1. Chama o serviço (ele lança erro se falhar, o componente trata)
        const response = await authService.signIn(credentials);
        const { access_token } = response;

        // 2. Salva o token
        localStorage.setItem('@LicitaDoc:token', access_token);

        // 3. Decodifica e atualiza estado do usuário
        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);

        // 4. Carrega o contexto (Empresas)
        await loadUserContext();
    }

    /**
     * Limpa a sessão completamente.
     */
    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        localStorage.removeItem('@LicitaDoc:companyId');
        setUser(null);
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
            // Opcional: Recarregar a página ou navegar para dashboard se necessário
            // window.location.href = '/dashboard'; 
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