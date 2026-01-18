import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bot, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Meus Documentos', path: '/documents' }, // Faremos em breve
        { icon: Bot, label: 'Consultor IA', path: '/ai-chat' },           // Faremos em breve
        { icon: Settings, label: 'Configurações', path: '/settings' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">

            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    LicitaDoc
                </span>
            </div>

            {/* Navegação */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )
                        }
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer do Menu */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                    <LogOut size={20} />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}