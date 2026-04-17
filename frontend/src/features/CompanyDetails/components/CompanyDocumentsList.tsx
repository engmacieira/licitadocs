import { FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '../../../components/ui/Button';
import type { DocumentDTO } from '../../../types';

/**
 * Propriedades do componente CompanyDocumentsList.
 * @interface CompanyDocumentsListProps
 */
interface CompanyDocumentsListProps {
    /** Lista de documentos associados à empresa. */
    documents: DocumentDTO[];
    /** Callback acionado para efetuar a transferência do documento. */
    onDownload: (doc: DocumentDTO) => void;
}

/**
 * Componente visual que lista todos os documentos armazenados no cofre
 * específico desta empresa e fornece o acesso rápido à transferência (download).
 */
export function CompanyDocumentsList({ documents, onDownload }: CompanyDocumentsListProps) {
    return (
        <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Arquivos Enviados ({documents.length})
                    </h3>
                </div>

                {documents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                        <FileText className="h-12 w-12 text-slate-200 mb-3" />
                        <p>Nenhum documento encontrado para esta empresa.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                        {documents.map(doc => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate" title={doc.title || doc.filename}>
                                            {doc.title || doc.filename}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="truncate max-w-[150px] sm:max-w-none" title={doc.filename}>
                                                {doc.filename}
                                            </span>
                                            {doc.created_at && (
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Calendar size={12} />
                                                    {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDownload(doc)}
                                    className="shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                >
                                    <Download size={18} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}