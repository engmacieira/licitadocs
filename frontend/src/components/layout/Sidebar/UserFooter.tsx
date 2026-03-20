import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente de rodapé da Sidebar.
 * Exibe o mini-perfil do utilizador autenticado (avatar, nome, função) e a ação de encerramento de sessão.
 */
export function UserFooter() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.role === 'admin';

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    return (
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.sub?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate" title={user?.sub}>{user?.sub}</span>
                    <span className="text-xs text-slate-500 capitalize">{isAdmin ? 'Administrador' : 'Cliente'}</span>
                </div>
            </div>

            <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
                <LogOut className="mr-3 h-5 w-5" />
                Sair
            </button>
        </div>
    );
}