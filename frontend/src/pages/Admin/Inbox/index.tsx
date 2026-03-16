import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Inbox as InboxIcon, MessageSquare, Send, CheckCircle2, Clock, User, Building2 } from 'lucide-react';

import api from '../../../services/api';
import { Button } from '../../../components/ui/Button';

export function AdminInbox() {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadTickets();
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

    // Filtra apenas as mensagens "Pai" (Tickets originais) para a lista da esquerda
    const parentTickets = messages.filter(m => m.parent_id === null);

    // Pega o ticket selecionado e todas as suas respostas
    const activeThread = messages.filter(m => m.id === selectedTicketId || m.parent_id === selectedTicketId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const activeTicket = parentTickets.find(t => t.id === selectedTicketId);

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

            {/* COLUNA ESQUERDA: LISTA DE TICKETS */}
            <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <InboxIcon className="h-5 w-5 text-purple-600" />
                    <h2 className="font-bold text-slate-800">Caixa de Entrada</h2>
                    <span className="ml-auto bg-purple-100 text-purple-700 py-0.5 px-2 rounded-full text-xs font-bold">
                        {parentTickets.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Carregando...</div>
                    ) : parentTickets.length === 0 ? (
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
                                <p className="text-xs text-slate-500 line-clamp-1">{ticket.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.is_resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {ticket.is_resolved ? 'Resolvido' : 'Aberto'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* COLUNA DIREITA: CONVERSA / THREAD */}
            <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                {!activeTicket ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <MessageSquare className="h-12 w-12 mb-4 text-slate-200" />
                        <p>Selecione um ticket na lista ao lado para visualizar a conversa e responder.</p>
                    </div>
                ) : (
                    <>
                        {/* Header da Conversa */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">{activeTicket.subject || 'Sem Assunto'}</h2>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <Building2 className="h-3 w-3" /> Solicitante: {activeTicket.sender_name}
                                </p>
                            </div>
                            {!activeTicket.is_resolved && (
                                <Button size="sm" variant="outline" onClick={handleResolve} className="text-green-600 border-green-200 hover:bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Resolvido
                                </Button>
                            )}
                        </div>

                        {/* Balões de Mensagem */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {activeThread.map(msg => {
                                // Se o remetente for diferente do autor do ticket original, assumimos que é você (Admin) respondendo
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
                        <div className="p-4 bg-white border-t border-slate-100">
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
        </div>
    );
}