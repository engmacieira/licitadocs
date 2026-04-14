import { Clock, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { DocumentDTO } from '@/types';

/**
 * Propriedades do componente ExpiringDocsPanel.
 * @interface ExpiringDocsPanelProps
 */
interface ExpiringDocsPanelProps {
    /** Indica se os dados ainda estão sendo carregados da API. */
    loading: boolean;
    /** Lista de documentos a vencer ou já vencidos. */
    expiringDocs: DocumentDTO[];
    /** Função para navegar para o monitor global de validades. */
    onNavigate: () => void;
}

/**
 * Painel visual de "Próximos Vencimentos".
 * Exibe a lista dos 5 documentos mais próximos do vencimento (ou já vencidos),
 * formatando as datas e aplicando as cores de alerta adequadas.
 */
export function ExpiringDocsPanel({ loading, expiringDocs, onNavigate }: ExpiringDocsPanelProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Próximos Vencimentos
                </h2>
                {expiringDocs.length > 0 && (
                    <button onClick={onNavigate} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        Ver calendário completo
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
                ) : expiringDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                        <CheckCircle2 className="h-14 w-14 text-green-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Tudo em dia</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">Não existem documentos ou certidões a vencer nos próximos 30 dias.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {expiringDocs.slice(0, 5).map((doc) => {
                            // Pinta de vermelho se já venceu, amarelo se vai vencer
                            const isExpired = new Date(doc.expiration_date!) < new Date(new Date().setHours(0, 0, 0, 0));

                            return (
                                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-start gap-3 overflow-hidden">
                                        <div className="mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-sm text-slate-800 truncate" title={doc.title || doc.filename}>
                                                {doc.title || doc.filename}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate" title={doc.company_name}>
                                                {doc.company_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center sm:justify-end shrink-0 pl-10 sm:pl-0">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${isExpired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                            <Clock size={12} />
                                            {isExpired ? 'Vencido em' : 'Vence a'} {format(new Date(doc.expiration_date!), 'dd/MM', { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}