import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Imports dos Serviços (Clean Architecture)
import { authService } from '../services/authService';
import type { SignInCredentials } from '../types';
import { userService } from '../services/userService';
import type { UserCompany, UserProfile } from '../types';

// --- OAUTH: IMPORT DO CLIENTE SUPABASE ---
// IMPORTANTE: Ajuste este caminho para apontar para o seu cliente Supabase real
import { supabase } from '../services/supabase.ts'; // Exemplo de importação

/**
 * Interface que representa o *payload* (conteúdo decodificado) do token JWT.
 * @interface User
 */
interface User {
    sub: string;
    role: string;
    id: string;
    user_id: string;
    exp?: number;
}

/**
 * Estrutura de dados globais fornecida pelo contexto de Autenticação.
 * @interface AuthContextData
 */
interface AuthContextData {
    user: User | null;
    userProfile: UserProfile | null;
    isAuthenticated: boolean;
    signIn: (credentials: SignInCredentials) => Promise<void>;

    // --- OAUTH: NOVA FUNÇÃO DE LOGIN SOCIAL ---
    /** Função assíncrona para iniciar uma sessão OAuth via Supabase (Google, Microsoft, etc). */
    signInWithProvider: (provider: 'google' | 'azure') => Promise<void>;

    signOut: () => void;
    loading: boolean;
    companies: UserCompany[];
    currentCompany: UserCompany | null;
    switchCompany: (companyId: string) => void;
    reloadContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [companies, setCompanies] = useState<UserCompany[]>([]);
    const [currentCompany, setCurrentCompany] = useState<UserCompany | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserContext = useCallback(async () => {
        try {
            const profile = await userService.getMe();
            setUserProfile(profile);

            const myCompanies = await userService.getMyCompanies();
            setCompanies(myCompanies);

            if (myCompanies.length > 0) {
                const lastCompanyId = localStorage.getItem('@LicitaDoc:companyId');
                const target = myCompanies.find(c => c.id === lastCompanyId) || myCompanies[0];
                setCurrentCompany(prev => (prev?.id === target.id ? prev : target));
                localStorage.setItem('@LicitaDoc:companyId', target.id);
            }
        } catch (error) {
            console.error("AuthContext: Falha ao carregar contexto do utilizador", error);
        }
    }, []);

    const reloadContext = useCallback(async () => {
        await loadUserContext();
    }, [loadUserContext]);

    // --- OAUTH: TRATAMENTO DO RETORNO DO SUPABASE ---
    /**
     * Efeito Inicial: Restaura a sessão ao recarregar a página (F5) E trata o retorno do OAuth.
     * Quando o Supabase redireciona o usuário de volta, ele pode colocar o token na URL (hash).
     * O cliente do Supabase já lida com isso se estiver escutando a sessão.
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

        // --- OAUTH: ESCUTANDO MUDANÇAS DE SESSÃO DO SUPABASE ---
        // Se o seu login padrão (email/senha) já salva o token localmente, 
        // nós usamos esse listener para capturar o momento em que o OAuth retorna com sucesso.
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Se o login foi por OAuth e o Supabase emitiu um token
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    const accessToken = session.access_token;
                    // Previne sobrescrever o token se o login manual já o setou
                    if (localStorage.getItem('@LicitaDoc:token') !== accessToken) {
                        localStorage.setItem('@LicitaDoc:token', accessToken);
                        const decoded = jwtDecode<User>(accessToken);
                        setUser(decoded);
                        await loadUserContext();
                    }
                } else if (event === 'SIGNED_OUT') {
                    // Cuidado aqui para não conflitar com a sua função signOut manual.
                    // O ideal é apenas limpar estados locais se necessário.
                    setUser(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };

    }, [loadUserContext]);

    useEffect(() => {
        if (user || !localStorage.getItem('@LicitaDoc:token')) {
            setLoading(false);
        }
    }, [user]);

    async function signIn(credentials: SignInCredentials) {
        const response = await authService.signIn(credentials);
        const { access_token } = response;
        localStorage.setItem('@LicitaDoc:token', access_token);
        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);
        await loadUserContext();
    }

    // --- OAUTH: IMPLEMENTAÇÃO DA FUNÇÃO ---
    /**
     * Inicia o fluxo de login via OAuth com o provedor selecionado.
     * Redireciona o usuário para a página de consentimento do provedor.
     */
    async function signInWithProvider(provider: 'google' | 'azure') {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                // Se quiser redirecionar para uma rota específica após o login
                // redirectTo: `${window.location.origin}/dashboard` 
            }
        });

        if (error) {
            console.error(`AuthContext: Erro no login OAuth com ${provider}`, error.message);
            throw error;
        }
    }

    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        localStorage.removeItem('@LicitaDoc:companyId');
        setUser(null);
        setUserProfile(null);
        setCompanies([]);
        setCurrentCompany(null);

        // --- OAUTH: DESLOGA NO SUPABASE TAMBÉM ---
        supabase.auth.signOut().catch(console.error);
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
            userProfile,
            isAuthenticated: !!user,
            signIn,
            signInWithProvider, // --- OAUTH EXPORTADO ---
            signOut,
            loading,
            companies,
            currentCompany,
            switchCompany,
            reloadContext
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}