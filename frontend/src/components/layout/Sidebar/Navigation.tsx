import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Building2,
    Settings,
    UploadCloud,
    Hourglass,
    MapPin,
    LayoutGrid,
    LifeBuoy,
    InboxIcon,
    FilePen
} from 'lucide-react';

/**
 * Propriedades do componente Navigation.
 * @interface NavigationProps
 */
interface NavigationProps {
    /** Define se o utilizador atual possui privilégios de administrador. */
    isAdmin: boolean;
}

/**
 * Componente responsável por renderizar a lista de links do menu lateral.
 * Adapta os links exibidos dinamicamente com base no perfil do utilizador (Admin vs Cliente).
 */
export function Navigation({ isAdmin }: NavigationProps) {
    const { currentCompany } = useAuth();

    return (
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {isAdmin ? (
                <>
                    <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Visão Geral" activeColor="bg-purple-600" />
                    <NavItem to="/admin/inbox" icon={InboxIcon} label="Caixa de Entrada" activeColor="bg-purple-600" />
                    <NavItem to="/admin/companies" icon={Building2} label="Gestão de Empresas" activeColor="bg-purple-600" />
                    <NavItem to="/admin/upload" icon={UploadCloud} label="Upload Centralizado" activeColor="bg-purple-600" />
                    <NavItem to="/admin/validity-monitor" icon={Hourglass} label="Monitor de Vencimento" activeColor="bg-purple-600" />
                    <NavItem to="/admin/settings" icon={Settings} label="Configurações" activeColor="bg-purple-600" />
                    <NavItem to="/admin/emission-rules" icon={MapPin} label="Regras de Emissão" activeColor="bg-purple-600" />
                </>
            ) : (
                <>
                    <NavItem to="/dashboard" icon={LayoutDashboard} label="Visão Geral" activeColor="bg-blue-600" />
                    <NavItem to="/documents" icon={FileText} label="Meus Documentos" activeColor="bg-blue-600" />
                    <NavItem to="/document-templates" icon={LayoutGrid} label="Modelos de Documentos" activeColor="bg-blue-600" />
                    <NavItem to="/help-center" icon={LifeBuoy} label="Ajuda e Suporte" activeColor="bg-blue-600" />
                    <NavItem to="/signature" icon={FilePen} label="Assinatura" activeColor="bg-blue-600" />
                    {currentCompany?.role === 'MASTER' && (
                        <NavItem to="/company-settings" icon={Settings} label="Minha Empresa" activeColor="bg-blue-600" />
                    )}
                </>
            )}
        </nav>
    );
}

/**
 * Propriedades do item de navegação individual.
 * @interface NavItemProps
 */
interface NavItemProps {
    to: string;
    icon: any;
    label: string;
    activeColor: string;
}

/**
 * Subcomponente para renderizar um link de navegação individual.
 * Gere automaticamente o seu estado visual (ativo/inativo) com base na rota da URL atual.
 */
function NavItem({ to, icon: Icon, label, activeColor }: NavItemProps) {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive
                ? `${activeColor} text-white shadow-md shadow-blue-900/20`
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
        >
            <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="truncate">{label}</span>
        </Link>
    );
}