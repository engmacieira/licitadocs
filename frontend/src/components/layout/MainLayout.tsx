import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { User, Menu, X } from 'lucide-react';
import { ChatWidget } from '../ChatWidget';

export function MainLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const pageTitles: Record<string, string> = {
        '/dashboard': 'Visão Geral',
        '/documents': 'Meus Documentos',
        '/ai-chat': 'Consultor IA',
        '/admin/dashboard': 'Painel Administrativo',
        '/admin/companies': 'Gestão de Empresas',
        '/admin/upload': 'Upload de Documentos'
    };

    const currentTitle = pageTitles[location.pathname] || 'LicitaDoc';

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* Sidebar Desktop (Fixo, Escondido em Mobile) */}
            <Sidebar className="hidden md:flex w-64 h-screen sticky top-0" />

            {/* Sidebar Mobile (Drawer com Overlay) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Overlay Escuro (Ao clicar, fecha) */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Menu Lateral Animado */}
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar className="flex w-72 h-full shadow-2xl animate-in slide-in-from-left duration-300" />

                        {/* Botão Fechar dentro do contexto do menu */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 -right-12 text-white bg-slate-800 p-2 rounded-full shadow-lg border border-slate-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 min-w-0 transition-all duration-300 flex flex-col">

                {/* Header (Sticky) */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Botão Menu Mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                            {currentTitle}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                {user?.sub || 'Usuário'}
                            </p>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${user?.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {user?.role}
                            </span>
                        </div>

                        <div className="h-9 w-9 bg-linear-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 shadow-sm">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                {/* Conteúdo da Página com Scroll Independente */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </div>

                {/* Chat Widget Flutuante */}
                <ChatWidget />

            </main>
        </div>
    );
}