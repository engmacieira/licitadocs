import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, Building2, UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    className?: string; // Para controle mobile futuro
}

export function Sidebar({ className }: SidebarProps) {
    const { signOut, user } = useAuth();

    // Menu dinâmico baseado no cargo (Role)
    const isAdmin = user?.role === 'admin';

    const navItems = [
        {
            icon: LayoutDashboard,
            label: isAdmin ? 'Painel Admin' : 'Visão Geral',
            path: isAdmin ? '/admin/dashboard' : '/dashboard'
        },
        // Itens de Admin
        ...(isAdmin ? [
            { icon: Building2, label: 'Empresas', path: '/admin/companies' },
            { icon: UploadCloud, label: 'Upload Admin', path: '/admin/upload' },
        ] : [
            // Itens de Cliente
            { icon: FileText, label: 'Meus Documentos', path: '/documents' },
        ]),
        // Comum
        // { icon: Settings, label: 'Configurações', path: '/settings' }, 
    ];

    return (
        <aside className={clsx(
            "w-64 bg-slate-900 text-white flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-20 transition-transform",
            // Se não passar className, assume comportamento padrão (visível desktop)
            className || "hidden md:flex"
        )}>

            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
                <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                    LicitaDoc <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">v1.0</span>
                </span>
            </div>

            {/* Navegação */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                    Menu Principal
                </p>

                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1"
                            )
                        }
                    >
                        {/* Ícone com brilho no hover */}
                        <item.icon size={18} className="group-hover:text-blue-400 transition-colors" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer do Menu */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg text-sm font-medium transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}