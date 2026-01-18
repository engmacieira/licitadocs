import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';

export function MainLayout() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Menu Lateral Fixo */}
            <Sidebar />

            {/* Área de Conteúdo Principal (Deslocada para a direita) */}
            <main className="flex-1 ml-64 min-w-0">

                {/* Header Simples */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-slate-700">
                        Painel Administrativo
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{user?.sub}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-600">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                {/* Onde as páginas vão aparecer */}
                <div className="p-8">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}