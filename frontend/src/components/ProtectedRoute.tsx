import type { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * Propriedades do componente ProtectedRoute.
 * @interface ProtectedRouteProps
 */
interface ProtectedRouteProps {
    /** O componente de página (ou layout) que será renderizado se o acesso for permitido. */
    children: ReactNode;
    /** * Lista opcional de papéis (roles) autorizados a aceder a esta rota.
     * Exemplo: ['admin', 'manager']. Se não for fornecido, apenas exige que o utilizador esteja logado.
     */
    allowedRoles?: string[];
}

/**
 * Componente de Guarda de Rotas (Router Guard).
 * Intercepta a navegação do utilizador para garantir que este está autenticado
 * e possui as permissões (roles) necessárias para visualizar a página solicitada.
 * * Funciona através de 4 estados sequenciais:
 * 1. Carregamento (Validação de sessão em curso)
 * 2. Redirecionamento (Utilizador não autenticado -> Login)
 * 3. Bloqueio (Utilizador autenticado, mas sem permissão -> Ecrã de Erro)
 * 4. Acesso Permitido (Renderiza os children)
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // ESTADO 1: Carregando (Verificando Token/Sessão na API ou LocalStorage)
    if (loading) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium animate-pulse">
                    Verificando credenciais...
                </p>
            </div>
        );
    }

    // ESTADO 2: Não Autenticado -> Manda para a raiz (Login/Landing)
    if (!isAuthenticated) {
        // Guarda a rota que o utilizador tentou aceder para o redirecionar de volta após o login
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // ESTADO 3: Autenticado mas sem Permissão (Blindagem de Rota baseada em Role)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center animate-in fade-in duration-500">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Seu perfil de usuário (<strong>{user.role}</strong>) não possui permissão para acessar esta página.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        Voltar
                    </button>
                    <Link
                        to="/dashboard"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Ir para o Início
                    </Link>
                </div>
            </div>
        );
    }

    // ESTADO 4: Acesso Permitido
    return <>{children}</>;
}