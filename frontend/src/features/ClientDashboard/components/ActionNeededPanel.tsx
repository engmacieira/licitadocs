import { useNavigate } from 'react-router-dom';
import { AlertOctagon, CheckCircle, XOctagon, AlertTriangle, ArrowRight, User, Shield } from 'lucide-react';
import type { DocumentDTO } from '../../../services/documentService';

/**
 * Propriedades do componente ActionNeededPanel.
 * @interface ActionNeededPanelProps
 */
interface ActionNeededPanelProps {
    /** Lista de documentos irregulares, com erro ou vencidos. */
    attentionDocs: DocumentDTO[];
}

/**
 * Painel visual que destaca as certidões e documentos que precisam da atenção
 * urgente do cliente (vencidos, erro na emissão ou irregulares).
 */
export function ActionNeededPanel({ attentionDocs }: ActionNeededPanelProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5 text-red-500" />
                    Ação Necessária
                </h2>
                {attentionDocs.length > 0 && (
                    <button onClick={() => navigate('/help-center')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        Falar com Suporte
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                {attentionDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                        <CheckCircle className="h-14 w-14 text-green-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Tudo em conformidade!</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">Nenhum documento vencido ou com pendência de emissão no seu cofre.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {attentionDocs.map(doc => {
                            const isError = doc.status === 'error';
                            const isIrregular = doc.status === 'irregular';

                            return (
                                <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className={`p-2.5 rounded-lg shrink-0 ${isError ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {isError ? <XOctagon size={20} /> : <AlertTriangle size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900 text-sm truncate" title={doc.title || doc.filename}>
                                                    {doc.title || doc.filename}
                                                </p>
                                                {/* Início: Distinção de Origem [US-2904] */}
                                                {doc.is_client_upload ? (
                                                    <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded border border-blue-200 font-bold uppercase tracking-tight shrink-0">
                                                        <User size={10} /> Seu Envio
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-tight shrink-0">
                                                        <Shield size={10} /> Oficial
                                                    </span>
                                                )}
                                                {/* Fim: Distinção de Origem */}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : isIrregular ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                    {isError ? 'Erro na Emissão' : isIrregular ? 'Irregularidade' : 'Vencido'}
                                                </span>
                                                <span className="text-xs text-slate-500 truncate" title={doc.filename}>{doc.filename}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/documents')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}