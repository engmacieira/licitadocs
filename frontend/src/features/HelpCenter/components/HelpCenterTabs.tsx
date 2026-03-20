import { MessageSquare, Bell, Plus, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { HelpCenterTab } from '../HelpCenterOrchestrator';

/**
 * Propriedades do componente HelpCenterTabs.
 * @interface HelpCenterTabsProps
 */
interface HelpCenterTabsProps {
    activeTab: HelpCenterTab;
    setActiveTab: (tab: HelpCenterTab) => void;
    parentTickets: any[];
    alerts: any[];
    isLoading: boolean;
    onOpenNewTicket: () => void;
    onSelectTicket: (id: string) => void;
    onSelectAlert: (id: string) => void;
    handleMarkAsRead: (e: React.MouseEvent, id: string) => void;
}

/**
 * Componente que renderiza a vista inicial da área direita.
 * Contém as abas para alternar entre Tickets e Alertas, listando os itens.
 */
export function HelpCenterTabs({
    activeTab, setActiveTab, parentTickets, alerts, isLoading,
    onOpenNewTicket, onSelectTicket, onSelectAlert, handleMarkAsRead
}: HelpCenterTabsProps) {
    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button onClick={() => setActiveTab('tickets')} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'tickets' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    <MessageSquare className="h-4 w-4" /> Meus Tickets <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{parentTickets.length}</span>
                </button>
                <button onClick={() => setActiveTab('alerts')} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'alerts' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    <Bell className="h-4 w-4" /> Avisos <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{alerts.length}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center text-slate-400 py-10">Carregando...</div>
                ) : activeTab === 'tickets' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Histórico de Chamados</h2>
                            <Button size="sm" onClick={onOpenNewTicket}><Plus className="h-4 w-4 mr-2" /> Novo Chamado</Button>
                        </div>

                        {parentTickets.length === 0 ? (
                            <EmptyState icon={MessageSquare} title="Nenhum ticket aberto" desc="Você ainda não abriu nenhum chamado." />
                        ) : (
                            parentTickets.map(ticket => (
                                <TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelectTicket(ticket.id)} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6">Alertas Automáticos</h2>
                        {alerts.length === 0 ? (
                            <EmptyState icon={Bell} title="Nenhum aviso" desc="Sua caixa de alertas está vazia." />
                        ) : (
                            alerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} onClick={() => onSelectAlert(alert.id)} onRead={(e) => handleMarkAsRead(e, alert.id)} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Subcomponentes locais
function EmptyState({ icon: Icon, title, desc }: any) {
    return (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
    );
}

function TicketCard({ ticket, onClick }: { ticket: any, onClick: () => void }) {
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-lg ${ticket.is_resolved ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {ticket.is_resolved ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{ticket.subject || "Chamado sem Assunto"}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-medium">
                        <span className="text-slate-400">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                        <span className={ticket.is_resolved ? 'text-green-600' : 'text-amber-600'}>
                            {ticket.is_resolved ? 'Resolvido' : 'Em Aberto'}
                        </span>
                    </div>
                </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
    );
}

function AlertCard({ alert, onClick, onRead }: { alert: any, onClick: () => void, onRead: (e: React.MouseEvent) => void }) {
    return (
        <div onClick={onClick} className={`p-4 rounded-xl border flex items-start justify-between gap-4 cursor-pointer hover:border-blue-300 transition-colors group ${alert.is_read ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-300'}`}>
            <div className="flex items-start gap-3">
                <Info className={`mt-0.5 shrink-0 ${alert.is_read ? 'text-slate-400' : 'text-amber-500'}`} size={20} />
                <div>
                    <h4 className={`text-sm ${alert.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{alert.subject || "Aviso Importante"}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.content}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">{new Date(alert.created_at).toLocaleString('pt-BR')}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                {!alert.is_read ? (
                    <Button size="sm" variant="outline" onClick={onRead} className="shrink-0 text-amber-700 border-amber-300 hover:bg-amber-100 bg-amber-50 relative z-10">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Ciente
                    </Button>
                ) : (
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors mt-2" />
                )}
            </div>
        </div>
    );
}