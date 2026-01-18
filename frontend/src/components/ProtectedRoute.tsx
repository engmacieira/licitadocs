import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Pode substituir por um Spinner de carregamento depois
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    if (!isAuthenticated) {
        // Se não estiver logado, redireciona para o login
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}