import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, CheckCircle2, Download, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentDTO } from '@/types';

/**
 * Propriedades do componente RecentUpdatesPanel.
 * @interface RecentUpdatesPanelProps
 */
interface RecentUpdatesPanelProps {
    /** Lista dos 5 documentos válidos mais recentes. */
    recentDocs: DocumentDTO[];
    /** Função acionada para efetuar a transferência do documento. */
    handleDownload: (id: string, filename: string) => void;
}

/**
 * Painel visual que exibe os documentos recentemente atualizados/emitidos.
 * Fornece um feedback psicológico positivo ao cliente de que a plataforma
 * está trabalhando continuamente em background.
 */
export function RecentUpdatesPanel({ recentDocs, handleDownload }: RecentUpdatesPanelProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    Últimas Atualizações no Cofre
                </h2>
                {recentDocs.length > 0 && (
                    <button onClick={() => navigate('/documents')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        Acessar Cofre
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                {recentDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                        <RefreshCw className="h-14 w-14 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Monitoramento Ativo</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">A nossa equipe monitora a sua empresa diariamente. Assim que houver renovações, elas aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentDocs.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2.5 rounded-lg bg-green-50 text-green-600 shrink-0 border border-green-100">
                                        <CheckCircle2 size={20} />
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
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Processado em {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => handleDownload(doc.id, doc.filename)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0">
                                    <Download size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}