import type { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[]; // Nova prop opcional para filtrar por tipo de usuário
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Estado 1: Carregando (Verificando Token/Sessão)
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

    // Estado 2: Não Autenticado -> Manda para Login
    if (!isAuthenticated) {
        // Salva a origem para redirecionar de volta após login
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Estado 3: Autenticado mas sem Permissão (Blindagem de Rota)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center animate-in fade-in duration-500">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Seu perfil de usuário (<strong>{user.role}</strong>) não possui permissão para acessar esta página administrativa.
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

    // Estado 4: Acesso Permitido
    return <>{children}</>;
}