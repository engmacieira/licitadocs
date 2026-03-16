import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { NewTicketModal } from './components/NewTicketModal';
import {
    LifeBuoy, MessageSquare, Bell, Clock, Calendar,
    Mail, Phone, MapPin, Plus, ChevronRight,
    CheckCircle2, AlertCircle, Info
} from 'lucide-react';

// Ajuste os imports conforme a sua estrutura real
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';

export function HelpCenterPage() {
    const { currentCompany } = useAuth();
    const [activeTab, setActiveTab] = useState<'tickets' | 'alerts'>('tickets');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados da API
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filtros de UX
    const tickets = messages.filter(m => m.message_type === 'chat' || m.message_type === 'action_required');
    const alerts = messages.filter(m => m.message_type === 'system');

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

                {/* COLUNA ESQUERDA: INFORMAÇÕES E CONTATOS (Baseado no Contrato) */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Card de Contatos */}
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

                    {/* Card de Horários e Feriados */}
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
                                    Conforme nosso contrato, o suporte e a contagem de prazos operacionais são suspensos durante feriados Nacionais, Estaduais (MG) e Municipais (Braúnas/MG).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: CAIXA DE MENSAGENS / TICKETS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'tickets' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <MessageSquare className="h-4 w-4" />
                                Meus Tickets
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tickets.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('alerts')}
                                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'alerts' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Bell className="h-4 w-4" />
                                Avisos do Sistema
                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{alerts.length}</span>
                            </button>
                        </div>

                        {/* Conteúdo Dinâmico */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {isLoading ? (
                                <div className="text-center text-slate-400 py-10">Carregando mensagens...</div>
                            ) : activeTab === 'tickets' ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-semibold text-slate-800">Histórico de Chamados</h2>
                                        {/* NOVO: onClick acionando o estado */}
                                        <Button size="sm" onClick={() => setIsModalOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" /> Novo Chamado
                                        </Button>
                                    </div>

                                    {tickets.length === 0 ? (
                                        <EmptyState icon={MessageSquare} title="Nenhum ticket aberto" desc="Você ainda não abriu nenhum chamado de suporte." />
                                    ) : (
                                        tickets.map(ticket => (
                                            <TicketCard key={ticket.id} ticket={ticket} />
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
                                            <AlertCard key={alert.id} alert={alert} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
            <NewTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadMessages}
            />
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

function TicketCard({ ticket }: { ticket: any }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group flex items-start justify-between gap-4">
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

function AlertCard({ alert }: { alert: any }) {
    return (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${alert.is_read ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200'}`}>
            <Info className={`mt-0.5 shrink-0 ${alert.is_read ? 'text-slate-400' : 'text-amber-500'}`} size={20} />
            <div>
                <h4 className={`text-sm ${alert.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                    {alert.subject || "Aviso Importante"}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.content}</p>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
}