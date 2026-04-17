import { Calendar, FileText, Building2, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentDTO } from '../../../types';

/**
 * Propriedades do componente ExpiringMonitor.
 * @interface ExpiringMonitorProps
 */
interface ExpiringMonitorProps {
    /** Lista de documentos a vencer ou já vencidos. */
    documents: DocumentDTO[];
    /** Termo de pesquisa digitado no orquestrador (filtra por empresa ou título). */
    searchTerm: string;
    /** Quantidade de dias selecionada no filtro (15, 30 ou 60 dias). */
    daysFilter: number;
    /** Callback acionado para transferir o documento. */
    onDownload: (id: string, filename: string) => void;
}

/**
 * Componente responsável por listar os documentos próximos da data de validade.
 * Aplica filtros locais de pesquisa e exibe um estado vazio (Empty State) claro
 * quando todos os documentos estão em dia.
 */
export function ExpiringMonitor({ documents, searchTerm, daysFilter, onDownload }: ExpiringMonitorProps) {

    // Filtra os documentos de forma reativa com base no input de pesquisa
    const filteredExpiring = documents.filter(doc =>
        doc.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredExpiring.length === 0) {
        return (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-700">Nenhum vencimento próximo.</p>
                <p className="text-sm">Não há documentos a vencer nos próximos {daysFilter} dias.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2">
            {filteredExpiring.map(doc => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-blue-300 transition-colors group">
                    <div className="flex items-start gap-4 overflow-hidden">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                            <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 truncate" title={doc.title || doc.filename}>
                                {doc.title || doc.filename}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400" /> {doc.company_name}</span>
                                {doc.expiration_date && (
                                    <span className="flex items-center gap-1.5 font-medium text-amber-600">
                                        <Clock size={14} className="text-amber-500" />
                                        Vence: {format(new Date(doc.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pl-14 sm:pl-0">
                        <button
                            onClick={() => onDownload(doc.id, doc.filename)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all"
                        >
                            <Download size={16} /> Baixar
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}