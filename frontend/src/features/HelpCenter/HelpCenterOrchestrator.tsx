import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { LifeBuoy } from 'lucide-react';

// Serviços e Contexto
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';

// Subcomponentes da Feature
import { ContactSidebar } from './components/ContactSidebar';
import { HelpCenterTabs } from './components/HelpCenterTabs';
import { TicketChat } from './components/TicketChat';
import { AlertViewer } from './components/AlertViewer';
import { NewTicketModal } from './components/NewTicketModal';

export type HelpCenterTab = 'tickets' | 'alerts';

/**
 * Orquestrador da Central de Ajuda do Cliente.
 * Gere o estado de navegação entre listas de tickets e alertas,
 * controla a comunicação com a API para carregar mensagens,
 * enviar respostas e confirmar leitura de avisos.
 */
export function HelpCenterOrchestrator() {
    const { currentCompany } = useAuth();

    // --- ESTADOS DE NAVEGAÇÃO E UI ---
    const [activeTab, setActiveTab] = useState<HelpCenterTab>('tickets');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- ESTADOS DA API ---
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS DE SELEÇÃO E CHAT ---
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // --- CONTAGEM GLOBAL ---
    const { fetchUnreadCount } = useUnreadCount();

    /** Carrega todas as mensagens e alertas associados à empresa. */
    const loadMessages = async () => {
        if (!currentCompany?.id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/messages/${currentCompany.id}`);
            setMessages(response.data);
        } catch (error) {
            toast.error("Erro ao carregar mensagens.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCompany]);

    // --- MARCAR TICKET COMO LIDO AO ABRIR ---
    useEffect(() => {
        if (selectedTicketId) {
            api.patch(`/messages/ticket/${selectedTicketId}/read`)
                .then(() => {
                    fetchUnreadCount();
                    loadMessages();
                })
                .catch(() => console.error("Erro ao marcar ticket como lido."));
        }
    }, [selectedTicketId, fetchUnreadCount]);

    // --- FILTROS E DERIVAÇÕES DE DADOS ---
    const alerts = messages.filter(m => m.message_type === 'system');
    const parentTickets = messages.filter(m => (m.message_type === 'chat' || m.message_type === 'action_required') && m.parent_id === null);

    const activeTicket = parentTickets.find(t => t.id === selectedTicketId);
    const activeThread = messages.filter(m => m.id === selectedTicketId || m.parent_id === selectedTicketId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const activeAlert = alerts.find(a => a.id === selectedAlertId);

    // --- ACÇÕES DE COMUNICAÇÃO ---
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
            fetchUnreadCount();
            loadMessages();
        } catch (error) {
            toast.error("Erro ao enviar resposta.");
        } finally {
            setIsReplying(false);
        }
    };

    const handleMarkAsRead = async (e: React.MouseEvent | null, alertId: string) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/messages/${alertId}/read`);
            fetchUnreadCount();
            loadMessages();
            // Volta para a lista automaticamente após marcar como lido
            setSelectedAlertId(null);
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
                <ContactSidebar />

                {/* COLUNA DIREITA: CAIXA DE MENSAGENS / TICKETS / AVISOS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">

                        {/* 1. VISÃO DE CHAT (Ticket Aberto) */}
                        {selectedTicketId && activeTicket ? (
                            <TicketChat
                                activeTicket={activeTicket}
                                activeThread={activeThread}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                handleReply={handleReply}
                                isReplying={isReplying}
                                onBack={() => setSelectedTicketId(null)}
                            />
                        ) : selectedAlertId && activeAlert ? (

                            // 2. VISÃO DE LEITURA (Aviso Aberto)
                            <AlertViewer
                                activeAlert={activeAlert}
                                handleMarkAsRead={handleMarkAsRead}
                                onBack={() => setSelectedAlertId(null)}
                            />

                        ) : (
                            // 3. VISÃO DE LISTAS (Tabs)
                            <HelpCenterTabs
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                parentTickets={parentTickets}
                                alerts={alerts}
                                isLoading={isLoading}
                                onOpenNewTicket={() => setIsModalOpen(true)}
                                onSelectTicket={setSelectedTicketId}
                                onSelectAlert={setSelectedAlertId}
                                handleMarkAsRead={handleMarkAsRead}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Novo Chamado */}
            <NewTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadMessages}
            />
        </div>
    );
}