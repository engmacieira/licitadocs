import { ShieldAlert, CheckCircle2, XOctagon, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

/**
 * Propriedades do componente UrgentAttentionPanel.
 * @interface UrgentAttentionPanelProps
 */
interface UrgentAttentionPanelProps {
    /** Indica se os dados ainda estão sendo carregados da API. */
    loading: boolean;
    /** Lista de irregularidades já agrupadas por empresa pelo orquestrador. */
    groupedIrregular: Array<{
        companyName: string;
        count: number;
        type: 'error' | 'irregular';
    }>;
    /** Função para navegar para o monitor global e resolver as pendências. */
    onNavigate: () => void;
}

/**
 * Painel visual de "Atenção Urgente".
 * Exibe o Top 5 de clientes com o maior número de pendências críticas (erros ou irregularidades).
 */
export function UrgentAttentionPanel({ loading, groupedIrregular, onNavigate }: UrgentAttentionPanelProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Atenção Urgente
                </h2>
                {groupedIrregular.length > 0 && (
                    <button onClick={onNavigate} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        Ver todas as pendências
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                ) : groupedIrregular.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                        <CheckCircle2 className="h-14 w-14 text-green-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Cofres Limpos</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">Não existem empresas com documentos irregulares ou com erro na emissão no momento.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {groupedIrregular.map((group, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${group.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {group.type === 'error' ? <XOctagon size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-800 truncate" title={group.companyName}>{group.companyName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${group.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {group.type === 'error' ? 'Erro na Emissão' : 'Irregular'}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500">
                                                {group.count} pendência{group.count > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="shrink-0 ml-4 hover:bg-slate-200" onClick={onNavigate}>
                                    Resolver <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}