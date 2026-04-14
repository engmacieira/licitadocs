import { Search, FileText, Link as LinkIcon, Mail, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { EmissionRuleDTO } from '@/types';
import type { ScopeTab } from '../RulesOrchestrator';

/**
 * Propriedades do componente RulesList.
 * @interface RulesListProps
 */
interface RulesListProps {
    loading: boolean;
    rules: EmissionRuleDTO[];
    activeTab: ScopeTab;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onEdit: (rule: EmissionRuleDTO) => void;
    onDelete: (id: string) => void;
}

/**
 * Componente visual que exibe a listagem de regras de emissão ativas.
 * Inclui uma barra de pesquisa local e as ações de edição e exclusão.
 */
export function RulesList({ loading, rules, activeTab, searchTerm, setSearchTerm, onEdit, onDelete }: RulesListProps) {
    const getTabName = () => {
        if (activeTab === 'NATIONAL') return 'Nacionais';
        if (activeTab === 'STATE') return 'Estaduais';
        return 'Municipais';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
                <h3 className="font-semibold text-slate-700">Regras {getTabName()}</h3>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar regra..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-6 space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            ) : rules.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                    Nenhuma regra {getTabName().toLowerCase()} encontrada.
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {rules.map(rule => (
                        <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                            <div>
                                <h4 className="font-semibold text-slate-800 text-md flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" />
                                    {rule.document_type_name}
                                </h4>
                                {(rule.state || rule.city) && (
                                    <p className="text-sm text-slate-500 mt-1">
                                        {rule.city ? `${rule.city} - ${rule.state}` : `Estado: ${rule.state}`}
                                    </p>
                                )}
                                <div className="flex gap-4 mt-2 text-xs text-slate-600">
                                    {rule.emission_link && <span className="text-blue-600 flex items-center gap-1 font-medium"><LinkIcon size={12} /> Portal Web</span>}
                                    {rule.contact_email && <span className="flex items-center gap-1"><Mail size={12} /> Email de Contato</span>}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(rule)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Regra">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => onDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Regra">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}