import { MessageSquare, Megaphone, Building2, CheckCircle2, Clock, User } from 'lucide-react';
import type { InboxTab } from '../InboxOrchestrator';

/**
 * Propriedades do componente InboxSidebar.
 * @interface InboxSidebarProps
 */
interface InboxSidebarProps {
    activeTab: InboxTab;
    setActiveTab: (tab: InboxTab) => void;
    isLoading: boolean;
    parentTickets: any[];
    alerts: any[];
    selectedTicketId: string | null;
    setSelectedTicketId: (id: string | null) => void;
    selectedAlertId: string | null;
    setSelectedAlertId: (id: string | null) => void;
}

/**
 * Componente visual que renderiza a barra lateral da caixa de entrada.
 * Contém as abas para alternar entre "Tickets" e "Avisos", além de 
 * listar os itens correspondentes a cada aba.
 */
export function InboxSidebar({
    activeTab, setActiveTab, isLoading, parentTickets, alerts,
    selectedTicketId, setSelectedTicketId, selectedAlertId, setSelectedAlertId
}: InboxSidebarProps) {
    return (
        <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            {/* TABS DE NAVEGAÇÃO */}
            <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'tickets' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                    <MessageSquare className="h-4 w-4" /> Tickets
                    <span className="bg-purple-100 text-purple-700 py-0.5 px-2 rounded-full text-xs ml-1">
                        {parentTickets.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'alerts' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                >
                    <Megaphone className="h-4 w-4" /> Avisos Emitidos
                </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {isLoading ? (
                    <div className="p-4 text-center text-slate-400 text-sm">A carregar...</div>
                ) : activeTab === 'tickets' ? (
                    // --- LISTA DE TICKETS ---
                    parentTickets.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Nenhum ticket aberto.</div>
                    ) : (
                        parentTickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2 ${selectedTicketId === ticket.id ? 'bg-purple-50/50 border-l-4 border-purple-500' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-slate-900 text-sm truncate pr-2">{ticket.subject || 'Sem Assunto'}</h3>
                                    <span className="text-[10px] text-slate-400 shrink-0">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="text-[11px] font-medium text-purple-600 truncate flex items-center gap-1 mt-0.5 mb-1.5">
                                    <Building2 className="h-3 w-3" /> {ticket.company_name}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">{ticket.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.is_resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {ticket.is_resolved ? 'Resolvido' : 'Aberto'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )
                ) : (
                    // --- LISTA DE AVISOS EMITIDOS ---
                    <div className="divide-y divide-slate-100">
                        {alerts.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">Nenhum aviso disparado.</div>
                        ) : (
                            alerts.map(alert => (
                                <button
                                    key={alert.id}
                                    onClick={() => setSelectedAlertId(alert.id)}
                                    className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${selectedAlertId === alert.id ? 'bg-purple-50/50 border-l-4 border-purple-500' : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{alert.subject}</h4>
                                        {alert.is_read ? (
                                            <span title="Lido pelo cliente" className="flex shrink-0">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            </span>
                                        ) : (
                                            <span title="Ainda não lido" className="flex shrink-0">
                                                <Clock className="h-4 w-4 text-slate-300" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] font-medium text-purple-600 truncate flex items-center gap-1 mb-1">
                                        <Building2 className="h-3 w-3" /> {alert.company_name}
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">{alert.content}</p>
                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <User className="h-3 w-3" /> Disparado por {alert.sender_name} em {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}