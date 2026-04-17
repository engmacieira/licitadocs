import { UserPlus, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { Company } from '../../../types';

interface PendingCompaniesPanelProps {
    loading: boolean;
    companies: Company[];
}

/**
 * Painel de Triagem de Novas Empresas [US-2901].
 * Lista empresas cadastradas que ainda não foram verificadas por um admin.
 */
export function PendingCompaniesPanel({ loading, companies }: PendingCompaniesPanelProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                    Novos Cadastros (Aguardando Triagem)
                </h2>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                ) : companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                        <CheckCircle2 className="h-14 w-14 text-green-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Tudo verificado</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">Não existem empresas aguardando aprovação administrativa no momento.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {companies.slice(0, 5).map((company) => (
                            <div key={company.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-800 truncate" title={company.razao_social}>
                                            {company.razao_social}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            CNPJ: {company.cnpj}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0 ml-4 hover:bg-indigo-50 hover:text-indigo-600"
                                    onClick={() => navigate(`/admin/companies/${company.id}`)}
                                >
                                    Analisar <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {companies.length > 5 && (
                            <div className="p-3 bg-slate-50 text-center">
                                <button
                                    onClick={() => navigate('/admin/companies')}
                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                                >
                                    Ver mais {companies.length - 5} empresas pendentes
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}