import { Link } from 'react-router-dom';
import { Building2, ExternalLink, User, Clock, CheckCircle2, Megaphone, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente BroadcastViewer.
 * @interface BroadcastViewerProps
 */
interface BroadcastViewerProps {
    activeAlert: any;
    onClearSelection: () => void;
    onOpenModal: () => void;
}

/**
 * Componente visual que exibe o ecrã inicial de Comunicados 
 * ou os detalhes de um aviso (broadcast) enviado no passado.
 */
export function BroadcastViewer({ activeAlert, onClearSelection, onOpenModal }: BroadcastViewerProps) {
    if (activeAlert) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900">{activeAlert.subject}</h2>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                            <Link to={`/admin/companies/${activeAlert.company_id}`} className="font-medium text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1 transition-colors" title="Abrir perfil da empresa">
                                <Building2 className="h-3.5 w-3.5" />
                                {activeAlert.company_name}
                                <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                            </Link>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={onClearSelection} className="text-slate-600 border-slate-200 hover:bg-slate-100">
                        Voltar
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
                        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-100 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {activeAlert.sender_name}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(activeAlert.created_at).toLocaleString('pt-BR')}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${activeAlert.is_read ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {activeAlert.is_read ? <><CheckCircle2 className="h-3 w-3" /> Lido pelo cliente</> : <><Clock className="h-3 w-3" /> Pendente de leitura</>}
                            </span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {activeAlert.content}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-50/50">
            <Megaphone className="h-16 w-16 mb-6 text-purple-200" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Gestão de Comunicados</h2>
            <p className="max-w-md mb-8 text-sm">
                Envie avisos, atualizações de sistema ou notificações de cobrança para todas as empresas da plataforma ou selecione clientes específicos.
            </p>
            <Button onClick={onOpenModal} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30">
                <Plus className="h-5 w-5 mr-2" /> Disparar Novo Aviso
            </Button>
        </div>
    );
}