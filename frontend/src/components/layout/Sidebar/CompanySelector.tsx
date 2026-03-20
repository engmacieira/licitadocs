import { Link } from 'react-router-dom';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente de dropdown para troca rápida de contexto entre empresas do usuário (Tenant Switch).
 * Visível apenas para perfis de cliente.
 */
export function CompanySelector() {
    const { companies, currentCompany, switchCompany } = useAuth();

    return (
        <div className="relative group z-50">
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
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {companies.map((company) => (
                        <button
                            key={company.id}
                            onClick={() => switchCompany(company.id)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-700 ${currentCompany?.id === company.id ? "text-blue-400" : "text-slate-300"}`}
                        >
                            <div className={`h-2 w-2 rounded-full shrink-0 ${currentCompany?.id === company.id ? 'bg-blue-500' : 'bg-slate-600'}`} />
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
    );
}