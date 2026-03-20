import { ArrowLeft, User, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente AlertViewer.
 * @interface AlertViewerProps
 */
interface AlertViewerProps {
    activeAlert: any;
    handleMarkAsRead: (e: React.MouseEvent | null, id: string) => void;
    onBack: () => void;
}

/**
 * Componente visual que exibe o detalhe de um aviso enviado pelo Administrador,
 * bloqueando respostas e fornecendo um botão gigante de "Ciente".
 */
export function AlertViewer({ activeAlert, handleMarkAsRead, onBack }: AlertViewerProps) {
    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{activeAlert.subject || 'Aviso do Sistema'}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${activeAlert.is_read ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {activeAlert.is_read ? 'Lido' : 'Pendente de Leitura'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-5 text-xs text-slate-500 pb-4 border-b border-slate-100">
                        <User className="h-4 w-4" /> {activeAlert.sender_name || "Sistema"}
                        <span className="text-slate-300">•</span>
                        <Clock className="h-4 w-4" /> {new Date(activeAlert.created_at).toLocaleString('pt-BR')}
                    </div>

                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {activeAlert.content}
                    </p>

                    {!activeAlert.is_read && (
                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <Button onClick={(e) => handleMarkAsRead(e, activeAlert.id)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Ciente
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}