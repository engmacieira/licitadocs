import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Building2,
    Settings,
    LogOut,
    UploadCloud
} from 'lucide-react';

export function Sidebar() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Verifica se é admin (baseado na role definida no Backend)
    const isAdmin = user?.role === 'admin';

    // Define os links baseados no perfil
    const navItems = isAdmin
        ? [
            // --- MENU DO ADMINISTRADOR ---
            { label: 'Visão Geral', icon: LayoutDashboard, path: '/admin/dashboard' },
            { label: 'Gestão de Empresas', icon: Building2, path: '/admin/companies' },
            { label: 'Upload Centralizado', icon: UploadCloud, path: '/admin/upload' },
            { label: 'Configurações', icon: Settings, path: '/settings' },
        ]
        : [
            // --- MENU DO CLIENTE ---
            { label: 'Meu Painel', icon: LayoutDashboard, path: '/dashboard' },
            { label: 'Meus Documentos', icon: FileText, path: '/documents' },
            { label: 'Minha Empresa', icon: Building2, path: '/company-profile' },
        ];

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300">
            {/* Header da Sidebar */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">LicitaDocs</span>
            </div>

            {/* Perfil Resumido */}
            <div className="px-6 py-6 border-b border-slate-800">
                <p className="text-sm font-medium text-white truncate">
                    {/* CORREÇÃO AQUI: Usamos 'sub' que é o campo padrão do JWT para o email/id */}
                    {user?.sub}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${isAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                        {isAdmin ? 'Administrador' : 'Cliente'}
                    </span>
                </div>
            </div>

            {/* Navegação */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                                }`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}