import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    LifeBuoy, MessageSquare, Bell, Clock, Calendar,
    Mail, Phone, MapPin, Plus, ChevronRight,
    CheckCircle2, AlertCircle, Info, ArrowLeft, Send, User
} from 'lucide-react';

import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { NewTicketModal } from './components/NewTicketModal';

export function HelpCenterPage() {
    const { currentCompany } = useAuth();
    const [activeTab, setActiveTab] = useState<'tickets' | 'alerts'>('tickets');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- ESTADOS DA API ---
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS DE SELEÇÃO ---
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null); // NOVO ESTADO

    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        if (currentCompany?.id) {
            loadMessages();
        }
    }, [currentCompany]);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/messages/${currentCompany?.id}`);
            setMessages(response.data);
        } catch (error) {
            toast.error("Erro ao carregar mensagens.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FILTROS ---
    const alerts = messages.filter(m => m.message_type === 'system');
    const parentTickets = messages.filter(m => (m.message_type === 'chat' || m.message_type === 'action_required') && m.parent_id === null);

    // --- DADOS ATIVOS ---
    const activeTicket = parentTickets.find(t => t.id === selectedTicketId);
    const activeThread = messages.filter(m => m.id === selectedTicketId || m.parent_id === selectedTicketId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const activeAlert = alerts.find(a => a.id === selectedAlertId); // AVISO ATIVO

    // --- ACÇÕES ---
    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activeTicket || !currentCompany?.id) return;

        setIsReplying(true);
        try {
            await api.post(`/messages/${currentCompany.id}`, {
                content: replyText,
                message_type: 'chat',
                parent_id: activeTicket.id
            });
            setReplyText('');
            loadMessages();
        } catch (error) {
            toast.error("Erro ao enviar resposta.");
        } finally {
            setIsReplying(false);
        }
    };

    // Atualizado para receber o evento e evitar que o clique no botão abra o card sem querer
    const handleMarkAsRead = async (e: React.MouseEvent | null, alertId: string) => {
        if (e) e.stopPropagation(); // Evita a propagação do clique para o card pai

        try {
            await api.patch(`/messages/${alertId}/read`);
            loadMessages();
        } catch (error) {
            toast.error("Erro ao confirmar leitura do aviso.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">

            {/* Cabeçalho */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <LifeBuoy className="text-blue-600 h-7 w-7" /> Central de Ajuda & Suporte
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Acompanhe seus chamados, leia avisos do sistema e veja nossos canais de atendimento.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUNA ESQUERDA: INFORMAÇÕES E CONTATOS */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Phone className="h-5 w-5 text-blue-600" /> Fale Conosco
                        </h3>
                        <div className="space-y-4">
                            <ContactItem icon={Mail} label="E-mail de Suporte" value="suporte@licitadocs.com.br" />
                            <ContactItem icon={Phone} label="WhatsApp" value="(00) 00000-0000" />
                            <ContactItem icon={MapPin} label="Sede" value="Braúnas / MG" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-slate-600" /> Horário de Atendimento
                        </h3>
                        <div className="space-y-3 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <strong>Segunda a Sexta:</strong> 08h00 às 18h00
                            </p>
                            <div className="pt-3 border-t border-slate-200">
                                <p className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Calendário de Feriados
                                </p>
                                <p className="text-xs leading-relaxed">
                                    O suporte e a contagem de prazos são suspensos durante feriados Nacionais, Estaduais (MG) e Municipais (Braúnas/MG).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: CAIXA DE MENSAGENS / TICKETS / AVISOS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">

                        {/* 1. VISÃO DE CHAT (Ticket Aberto) */}
                        {selectedTicketId && activeTicket ? (
                            <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                                    <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm truncate">{activeTicket.subject || 'Chamado'}</h3>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${activeTicket.is_resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {activeTicket.is_resolved ? 'Resolvido' : 'Em Aberto'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                    {activeThread.map(msg => {
                                        const isMe = msg.sender_id === activeTicket.sender_id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 text-sm shadow-sm rounded-2xl ${isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-1 opacity-80 text-[11px]">
                                                        <span>{isMe ? 'Você' : msg.sender_name || 'Suporte LicitaDoc'}</span>
                                                        <span className="ml-auto flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                                    {activeTicket.is_resolved ? (
                                        <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-lg text-sm flex items-center justify-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Chamado encerrado.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleReply} className="flex gap-3">
                                            <Input
                                                className="mb-0 flex-1"
                                                placeholder="Escreva sua resposta..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <Button type="submit" isLoading={isReplying} disabled={!replyText.trim()}>
                                                <Send className="h-4 w-4 shrink-0" />
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : selectedAlertId && activeAlert ? (

                            // 2. VISÃO DE LEITURA (Aviso Aberto)
                            <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                                    <button onClick={() => setSelectedAlertId(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
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

                                        {/* Botão Gigante de Ciente no final do texto se não estiver lido */}
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

                        ) : (
                            // 3. VISÃO DE LISTAS (Tabs)
                            <div className="flex flex-col h-full animate-in fade-in duration-300">
                                {/* Tabs */}
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
                                                <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Chamado</Button>
                                            </div>

                                            {parentTickets.length === 0 ? (
                                                <EmptyState icon={MessageSquare} title="Nenhum ticket aberto" desc="Você ainda não abriu nenhum chamado." />
                                            ) : (
                                                parentTickets.map(ticket => (
                                                    <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicketId(ticket.id)} />
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
                                                    <AlertCard
                                                        key={alert.id}
                                                        alert={alert}
                                                        onClick={() => setSelectedAlertId(alert.id)}
                                                        onRead={(e) => handleMarkAsRead(e, alert.id)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadMessages} />
        </div>
    );
}

// --- SUB-COMPONENTES UI ---
function ContactItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon size={18} /></div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

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
                    <h4 className={`text-sm ${alert.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {alert.subject || "Aviso Importante"}
                    </h4>
                    {/* Alterado de whitespace-pre-wrap para line-clamp-2 na lista */}
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.content}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
                {!alert.is_read ? (
                    // Botão com stopPropagation injetado no handleMarkAsRead lá em cima
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