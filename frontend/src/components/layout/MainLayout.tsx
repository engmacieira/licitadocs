import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { ChatWidget } from '../../features/AIConsultant/components/ChatWidget'; // No futuro (US-2504) virá de features/AI

/**
 * Componente de Layout Principal da aplicação.
 * Fornece a estrutura de grid responsiva, contendo a Sidebar (menu lateral), 
 * o TopHeader (cabeçalho superior) e a área central de conteúdo (Outlet).
 */
export function MainLayout() {
    // Único estado necessário aqui é o controle do menu mobile
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Desktop */}
            <Sidebar className="hidden md:flex w-64 h-screen sticky top-0" />

            {/* Overlay e Sidebar Mobile */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar className="flex w-72 h-full shadow-2xl animate-in slide-in-from-left duration-300" />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 -right-12 text-white bg-slate-800 p-2 rounded-full shadow-lg border border-slate-700"
                            aria-label="Fechar menu"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 min-w-0 transition-all duration-300 flex flex-col">
                <TopHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Onde as páginas são renderizadas */}
                    <Outlet />
                </div>

                <ChatWidget />
            </main>
        </div>
    );
}