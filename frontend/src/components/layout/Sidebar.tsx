import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Building2,
    Settings,
    LogOut,
    UploadCloud,
    ChevronDown,
    Plus,
    ShieldCheck
} from 'lucide-react';

export function Sidebar() {
    // 1. Hook unificado com as novas funções de Contexto
    const { user, signOut, companies, currentCompany, switchCompany } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // 2. Verificação de Admin (Lógica Original)
    const isAdmin = user?.role === 'admin';

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    return (
        <aside className="h-screen w-64 bg-slate-900 text-white flex flex-col">

            {/* --- HEADER --- */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isAdmin ? "bg-purple-600" : "bg-blue-600"}`}>
                        {isAdmin ? <ShieldCheck className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xl font-bold">LicitaDoc</span>
                </div>

                {/* SELETOR DE EMPRESA (Apenas Cliente e se tiver empresas carregadas) */}
                {!isAdmin && (
                    <div className="relative group">
                        <button className="w-full flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                <div className="flex flex-col items-start truncate">
                                    <span className="text-sm font-medium truncate w-32 text-left">
                                        {currentCompany?.razao_social || "Selecione..."}
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase">
                                        {currentCompany?.role || "..."}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>

                        {/* Dropdown (Lista de Empresas) */}
                        <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="py-1">
                                {companies.map((company) => (
                                    <button
                                        key={company.id}
                                        onClick={() => switchCompany(company.id)}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-700 ${currentCompany?.id === company.id ? "text-blue-400" : "text-slate-300"}`}
                                    >
                                        <div className={`h-2 w-2 rounded-full ${currentCompany?.id === company.id ? 'bg-blue-500' : 'bg-slate-600'}`} />
                                        <span className="truncate">{company.razao_social}</span>
                                    </button>
                                ))}
                                <div className="border-t border-slate-700 mt-1 pt-1">
                                    <Link
                                        to="/register"
                                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                                    >
                                        <Plus className="h-3 w-3" /> Nova Empresa
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Badge Visual para Admin */}
                {isAdmin && (
                    <div className="px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-center">
                        <span className="text-xs font-medium text-purple-300">Modo Administrador</span>
                    </div>
                )}
            </div>

            {/* --- NAVEGAÇÃO --- */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {isAdmin ? (
                    /* MENU DO ADMINISTRADOR (Roxo) */
                    <>
                        <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Visão Geral" activeColor="bg-purple-600" />
                        <NavItem to="/admin/companies" icon={Building2} label="Gestão de Empresas" activeColor="bg-purple-600" />
                        <NavItem to="/admin/upload" icon={UploadCloud} label="Upload Centralizado" activeColor="bg-purple-600" />
                        <NavItem to="/settings" icon={Settings} label="Configurações" activeColor="bg-purple-600" />
                    </>
                ) : (
                    /* MENU DO CLIENTE (Azul) */
                    <>
                        <NavItem to="/dashboard" icon={LayoutDashboard} label="Visão Geral" activeColor="bg-blue-600" />
                        <NavItem to="/documents" icon={FileText} label="Meus Documentos" activeColor="bg-blue-600" />

                        {/* Link Condicional: Só mostra Configurações da Empresa se for MASTER */}
                        {currentCompany?.role === 'MASTER' && (
                            <NavItem to="/company-settings" icon={Settings} label="Minha Empresa" activeColor="bg-blue-600" />
                        )}
                    </>
                )}
            </nav>

            {/* --- FOOTER (Logout) --- */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
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
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}

// Componente Helper para manter o código limpo e o estilo consistente
function NavItem({ to, icon: Icon, label, activeColor }: { to: string, icon: any, label: string, activeColor: string }) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive
                ? `${activeColor} text-white shadow-md shadow-blue-900/20`
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
        >
            <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            {label}
        </Link>
    );
}