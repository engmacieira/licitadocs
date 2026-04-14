import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Imports dos Serviços (Clean Architecture)
import { authService } from '../services/authService';
import type { SignInCredentials } from '@/types';
import { userService } from '../services/userService';
import type { UserCompany, UserProfile } from '@/types';

/**
 * Interface que representa o *payload* (conteúdo decodificado) do token JWT.
 * @interface User
 */
interface User {
    /** Identificador único do utilizador (geralmente o email ou UUID). */
    sub: string;
    /** Papel/Nível de acesso do utilizador (ex: 'admin', 'client'). */
    role: string;
    /** ID principal de referência no banco de dados. */
    id: string;
    /** ID de relacionamento com a tabela de utilizadores. */
    user_id: string;
    /** *Timestamp* de expiração do token. */
    exp?: number;
}

/**
 * Estrutura de dados globais fornecida pelo contexto de Autenticação.
 * @interface AuthContextData
 */
interface AuthContextData {
    /** Dados básicos do utilizador extraídos do token JWT. */
    user: User | null;
    /** Perfil completo do utilizador vindo da base de dados (ex: CPF, RG, etc). */
    userProfile: UserProfile | null;
    /** Flag booleana que indica se existe uma sessão ativa. */
    isAuthenticated: boolean;
    /** Função assíncrona para iniciar uma nova sessão (Login). */
    signIn: (credentials: SignInCredentials) => Promise<void>;
    /** Função para encerrar a sessão atual, limpando tokens e estados (Logout). */
    signOut: () => void;
    /** Flag que indica se o contexto ainda está a restaurar a sessão inicial durante o carregamento da página. */
    loading: boolean;

    // Multi-Tenancy
    /** Lista de empresas (tenants) vinculadas ao utilizador logado. */
    companies: UserCompany[];
    /** Empresa atualmente selecionada no contexto da aplicação. */
    currentCompany: UserCompany | null;
    /** Função para alternar o contexto ativo entre diferentes empresas. */
    switchCompany: (companyId: string) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * *Provider* de Autenticação Global.
 * Deve envolver toda a árvore de componentes da aplicação para fornecer
 * acesso ao estado do utilizador, sessão e contexto de multi-tenancy (empresas).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [companies, setCompanies] = useState<UserCompany[]>([]);
    const [currentCompany, setCurrentCompany] = useState<UserCompany | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Carrega as empresas do utilizador e o PERFIL COMPLETO da API.
     * Também gere a seleção automática da última empresa acedida através do *localStorage*.
     */
    const loadUserContext = useCallback(async () => {
        try {
            // 1. Busca os dados completos da pessoa (CPF, RG, Nacionalidade, etc)
            const profile = await userService.getMe();
            setUserProfile(profile);

            // 2. Busca as empresas associadas
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
            console.error("AuthContext: Falha ao carregar contexto do utilizador", error);
        }
    }, []);

    /**
     * Efeito Inicial: Restaura a sessão ao recarregar a página (F5).
     * Verifica a validade do token JWT armazenado e carrega o contexto se válido.
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

    // Garante que o estado de "loading" termine após a verificação de sessão
    useEffect(() => {
        if (user || !localStorage.getItem('@LicitaDoc:token')) {
            setLoading(false);
        }
    }, [user]);

    /**
     * Realiza a autenticação delegando para o serviço (authService).
     * Salva o token, decodifica as informações e aciona o carregamento do perfil.
     * * @param {SignInCredentials} credentials - Credenciais de acesso (email e senha).
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
     * Limpa a sessão completamente, removendo tokens do armazenamento local
     * e resetando os estados em memória.
     */
    function signOut() {
        localStorage.removeItem('@LicitaDoc:token');
        localStorage.removeItem('@LicitaDoc:companyId');
        setUser(null);
        setUserProfile(null);
        setCompanies([]);
        setCurrentCompany(null);
    }

    /**
     * Troca a empresa ativa na sessão atual (Tenant Switch) e salva a
     * preferência no armazenamento local.
     * * @param {string} companyId - Identificador único da empresa a ser ativada.
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
            userProfile,
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

/**
 * *Hook* customizado para aceder ao contexto de autenticação de forma simples.
 * @returns {AuthContextData} Todos os dados e métodos expostos pelo *AuthContext*.
 */
export function useAuth() {
    return useContext(AuthContext);
}