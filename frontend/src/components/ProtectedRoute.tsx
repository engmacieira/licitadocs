import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // UX: Tela de carregamento centralizada e elegante
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium animate-pulse">
                    Verificando credenciais...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redireciona para login, mas salva de onde a pessoa veio (state)
        // para mandar ela de volta pra lá depois de logar (opcional, mas boa prática)
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}