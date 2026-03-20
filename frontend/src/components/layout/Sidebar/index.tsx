import { useAuth } from '../../../contexts/AuthContext';
import { ShieldCheck, FileText } from 'lucide-react';
import { CompanySelector } from './CompanySelector';
import { Navigation } from './Navigation';
import { UserFooter } from './UserFooter';

/**
 * Propriedades do componente Sidebar.
 * @interface SidebarProps
 */
interface SidebarProps {
    /** Classes Tailwind opcionais para controlar largura e comportamento responsivo (ex: 'hidden md:flex') */
    className?: string;
}

/**
 * Componente principal do Menu Lateral (Sidebar).
 * Funciona como um "container" que agrupa o cabeçalho, seletor de empresas, navegação e rodapé.
 */
export function Sidebar({ className = "" }: SidebarProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    return (
        <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${className || 'h-screen w-64'}`}>

            {/* --- HEADER --- */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? "bg-purple-600" : "bg-blue-600"}`}>
                        {isAdmin ? <ShieldCheck className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xl font-bold truncate">LicitaDoc</span>
                </div>

                {isAdmin ? (
                    <div className="px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-center">
                        <span className="text-xs font-medium text-purple-300">Modo Administrador</span>
                    </div>
                ) : (
                    <CompanySelector />
                )}
            </div>

            {/* --- NAVEGAÇÃO --- */}
            <Navigation isAdmin={isAdmin} />

            {/* --- FOOTER --- */}
            <UserFooter />

        </aside>
    );
}