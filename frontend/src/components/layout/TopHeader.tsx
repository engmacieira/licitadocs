import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Menu } from 'lucide-react';

/**
 * Propriedades do componente TopHeader.
 * @interface TopHeaderProps
 */
interface TopHeaderProps {
    /** Função chamada ao clicar no botão de menu (hamburger) em dispositivos móveis. */
    onOpenMobileMenu: () => void;
}

/**
 * Componente de cabeçalho superior (Topbar) da aplicação.
 * Exibe o título dinâmico da página atual e o mini-perfil do utilizador à direita.
 * Fica fixo no topo da tela (sticky) durante o scroll.
 */
export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
    const { user } = useAuth();
    const location = useLocation();

    // Dicionário de títulos baseado na rota atual
    const pageTitles: Record<string, string> = {
        '/dashboard': 'Visão Geral',
        '/documents': 'Meus Documentos',
        '/company-settings': 'Configurações da Empresa',
        '/help-center': 'Ajuda e Suporte',
        '/ai-chat': 'Consultor IA',
        '/admin/dashboard': 'Painel Administrativo',
        '/admin/companies': 'Gestão de Empresas',
        '/admin/upload': 'Upload de Documentos'
    };

    const currentTitle = pageTitles[location.pathname] || 'LicitaDoc';

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                {/* Botão Menu Mobile (Visível apenas em ecrãs pequenos) */}
                <button
                    onClick={onOpenMobileMenu}
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Abrir menu de navegação"
                >
                    <Menu size={24} />
                </button>

                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                    {currentTitle}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                {/* Informações do Utilizador (Oculto em ecrãs muito pequenos para poupar espaço) */}
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                        {user?.sub || 'Usuário'}
                    </p>
                    <span className={`inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm mt-0.5 ${user?.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {user?.role}
                    </span>
                </div>

                {/* Avatar Genérico */}
                <div className="h-9 w-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 shadow-sm shrink-0">
                    <User size={18} />
                </div>
            </div>
        </header>
    );
}