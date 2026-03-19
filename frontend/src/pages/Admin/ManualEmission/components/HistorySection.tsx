import { History, Clock, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

// Exportado para ser partilhado com o index
export interface RequestHistoryItem {
    id: string;
    date: Date;
    companyId: string;
    companyName: string;
    estimatedDate: string;
    status: 'pending' | 'completed';
}

interface HistorySectionProps {
    requestHistory: RequestHistoryItem[];
    updateEstimateDate: (id: string, dateStr: string) => void;
    markAsCompleted: (id: string) => void;
}

export function HistorySection({ requestHistory, updateEstimateDate, markAsCompleted }: HistorySectionProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-purple-600" /> 3. Controle e Histórico
            </h2>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 custom-scrollbar">
                {requestHistory.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Nenhum pedido de CND registado para este município.</p>
                    </div>
                ) : (
                    requestHistory.map(req => (
                        <div key={req.id} className={`p-4 rounded-xl border ${req.status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'} transition-colors`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Data do Envio: {req.date.toLocaleDateString('pt-BR')} às {req.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1" title={req.companyName}>{req.companyName}</p>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {req.status === 'completed' ? 'Concluído' : 'Aguardando'}
                                </span>
                            </div>

                            {req.status === 'pending' && (
                                <div className="space-y-3 border-t border-slate-200 pt-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Previsão de Retorno (Prefeitura)</label>
                                        <input
                                            type="date"
                                            value={req.estimatedDate}
                                            onChange={(e) => updateEstimateDate(req.id, e.target.value)}
                                            className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <Button size="sm" onClick={() => markAsCompleted(req.id)} className="w-full bg-slate-800 hover:bg-slate-900 text-xs h-8">
                                        <Check className="h-3 w-3 mr-2" /> Certidão Recebida (Baixar)
                                    </Button>
                                </div>
                            )}

                            {req.status === 'completed' && req.estimatedDate && (
                                <p className="text-xs text-green-700 mt-2 font-medium bg-green-100/50 p-2 rounded">
                                    Previsão inicial era: {new Date(req.estimatedDate).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}