import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
    Inbox as InboxIcon, MessageSquare, Send, CheckCircle2,
    Clock, User, Building2, ExternalLink, Megaphone, Plus
} from 'lucide-react';

import api from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { NewBroadcastModal } from './components/NewBroadcastModal';

export function AdminInbox() {
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState<'tickets' | 'alerts'>('tickets');

    // Tickets (Chat)
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    // Avisos do Sistema
    const [alerts, setAlerts] = useState<any[]>([]);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

    const activeAlert = alerts.find(a => a.id === selectedAlertId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- CARREGAMENTO DE DADOS ---
    useEffect(() => {
        loadTickets();
        loadAlerts();
    }, []);

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/messages/admin/all');
            setMessages(data);
        } catch (error) {
            toast.error("Erro ao carregar a caixa de entrada.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadAlerts = async () => {
        try {
            const { data } = await api.get('/messages/admin/alerts');
            setAlerts(data);
        } catch (error) {
            toast.error("Erro ao carregar o histórico de avisos.");
        }
    };

    // --- FILTROS DE TICKETS ---
    const parentTickets = messages.filter(m => m.parent_id === null);
    const activeThread = messages.filter(m => m.id === selectedTicketId || m.parent_id === selectedTicketId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const activeTicket = parentTickets.find(t => t.id === selectedTicketId);

    // --- ACÇÕES ---
    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activeTicket) return;

        setIsSubmitting(true);
        try {
            await api.post(`/messages/${activeTicket.company_id}`, {
                content: replyText,
                message_type: 'chat',
                parent_id: activeTicket.id
            });
            toast.success("Resposta enviada!");
            setReplyText('');
            loadTickets();
        } catch (error) {
            toast.error("Erro ao enviar resposta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async () => {
        if (!activeTicket) return;
        try {
            await api.patch(`/messages/${activeTicket.id}/resolve`);
            toast.success("Ticket resolvido com sucesso!");
            loadTickets();
        } catch (error) {
            toast.error("Erro ao resolver ticket.");
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">

            {/* COLUNA ESQUERDA: LISTAGEM (TICKETS OU AVISOS) */}
            <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">

                {/* TABS DE NAVEGAÇÃO */}
                <div className="flex border-b border-slate-100 bg-slate-50">
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
                        <div className="p-4 text-center text-slate-400 text-sm">Carregando...</div>
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

            {/* COLUNA DIREITA: CONVERSA / AÇÕES */}
            <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                {activeTab === 'alerts' ? (
                    activeAlert ? (
                        // --- LEITURA DO AVISO SELECIONADO ---
                        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                            {/* Header do Aviso */}
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
                                <Button size="sm" variant="outline" onClick={() => setSelectedAlertId(null)} className="text-slate-600 border-slate-200 hover:bg-slate-100">
                                    Voltar
                                </Button>
                            </div>

                            {/* Conteúdo Completo */}
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
                    ) : (
                        // --- TELA DE AÇÃO PARA AVISOS ---
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-50/50">
                            <Megaphone className="h-16 w-16 mb-6 text-purple-200" />
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Gestão de Comunicados</h2>
                            <p className="max-w-md mb-8 text-sm">
                                Envie avisos, atualizações de sistema ou notificações de cobrança para todas as empresas da plataforma ou selecione clientes específicos.
                            </p>
                            <Button onClick={() => setIsBroadcastModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/30">
                                <Plus className="h-5 w-5 mr-2" /> Disparar Novo Aviso
                            </Button>
                        </div>
                    )
                ) : !activeTicket ? (
                    // --- TELA VAZIA DE TICKETS ---
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                        <MessageSquare className="h-12 w-12 mb-4 text-slate-200" />
                        <p>Selecione um ticket na lista ao lado para visualizar a conversa e responder.</p>
                    </div>
                ) : (
                    // --- CHAT DO TICKET SELECIONADO ---
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="font-bold text-slate-900">{activeTicket.subject || 'Sem Assunto'}</h2>

                                {/* Hiperlink da Empresa + Nome do Solicitante */}
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                                    <Link
                                        to={`/admin/companies/${activeTicket.company_id}`}
                                        className="font-medium text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1 transition-colors"
                                        title="Abrir perfil da empresa"
                                    >
                                        <Building2 className="h-3.5 w-3.5" />
                                        {activeTicket.company_name}
                                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                                    </Link>

                                    <span className="text-slate-300">•</span>

                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" /> {activeTicket.sender_name}
                                    </span>
                                </div>
                            </div>

                            {!activeTicket.is_resolved && (
                                <Button size="sm" variant="outline" onClick={handleResolve} className="text-green-600 border-green-200 hover:bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Resolvido
                                </Button>
                            )}
                        </div>

                        {/* Balões de Mensagem */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
                            {activeThread.map(msg => {
                                const isAdminReply = msg.sender_id !== activeTicket.sender_id;

                                return (
                                    <div key={msg.id} className={`flex ${isAdminReply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${isAdminReply ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                            <div className="flex items-center gap-2 mb-1 opacity-80 text-[11px]">
                                                <User className="h-3 w-3" />
                                                <span>{isAdminReply ? 'Você (Suporte)' : msg.sender_name}</span>
                                                <span className="ml-auto flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Área de Resposta */}
                        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                            {activeTicket.is_resolved ? (
                                <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-lg text-sm flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Este ticket foi marcado como resolvido.
                                </div>
                            ) : (
                                <form onSubmit={handleReply} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="flex-1 rounded-lg border-slate-300 py-2 px-4 focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                    <Button type="submit" isLoading={isSubmitting} disabled={!replyText.trim()} className="bg-purple-600 hover:bg-purple-700">
                                        <Send className="h-4 w-4 mr-2" /> Enviar
                                    </Button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* MODAL DE BROADCAST */}
            <NewBroadcastModal
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                onSuccess={loadAlerts}
            />
        </div>
    );
}