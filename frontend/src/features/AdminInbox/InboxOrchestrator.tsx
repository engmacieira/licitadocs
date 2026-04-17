import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import api from '../../services/api';
import { useUnreadCount } from '../../hooks/useUnreadCount';

import { companyService } from '../../services/companyService';
import type { Company } from '../../types';

// Subcomponentes da Feature
import { InboxSidebar } from './components/InboxSidebar';
import { TicketConversation } from './components/TicketConversation';
import { BroadcastViewer } from './components/BroadcastViewer';
import { NewBroadcastModal } from './components/NewBroadcastModal';

export type InboxTab = 'tickets' | 'alerts';

/**
 * Orquestrador da Central de Mensagens (Admin Inbox).
 * Gere o carregamento de tickets de suporte e avisos (broadcasts),
 * processa os envios de respostas, encerramento de tickets e 
 * controla o estado de navegação (abas e seleções) da interface.
 */
export function InboxOrchestrator() {
    // --- ESTADOS DE NAVEGAÇÃO ---
    const [activeTab, setActiveTab] = useState<InboxTab>('tickets');
    const [companies, setCompanies] = useState<Company[]>([]);

    // --- ESTADOS DE TICKETS (CHAT) ---
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    // --- ESTADOS DE AVISOS (BROADCAST) ---
    const [alerts, setAlerts] = useState<any[]>([]);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

    // --- ESTADOS DE CARREGAMENTO ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- ESTADOS DE FILTRO ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');

    // --- CONTAGEM GLOBAL ---
    const { fetchUnreadCount } = useUnreadCount();

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        loadTickets();
        loadAlerts();
        companyService.getAll().then(setCompanies).catch(console.error);
    }, []);

    // --- MARCAR TICKET COMO LIDO AO ABRIR ---
    useEffect(() => {
        if (selectedTicketId) {
            api.patch(`/messages/ticket/${selectedTicketId}/read`)
                .then(() => {
                    fetchUnreadCount();
                    loadTickets();
                })
                .catch(() => console.error("Erro ao marcar ticket como lido."));
        }
    }, [selectedTicketId, fetchUnreadCount]);

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

    /**
     * Lógica de Filtragem e Ordenação de Tickets [US-2903]
     */
    const filteredTickets = useMemo(() => {
        let result = messages.filter(m => m.is_parent);

        // 1. Filtro por Empresa
        if (selectedCompanyId) {
            result = result.filter(t => t.company_id === selectedCompanyId);
        }

        // 2. Filtro por Status
        if (statusFilter !== 'all') {
            const isResolvedTarget = statusFilter === 'resolved';
            result = result.filter(t => !!t.is_resolved === isResolvedTarget);
        }

        // 3. Busca Textual (Assunto ou Nome da Empresa)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.subject?.toLowerCase().includes(term) ||
                t.company_name?.toLowerCase().includes(term)
            );
        }

        // 4. Ordenação
        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [messages, searchTerm, statusFilter, selectedCompanyId, sortOrder]);

    // --- DERIVAÇÕES E FILTROS DE DADOS ---
    const parentTickets = messages.filter(m => m.parent_id === null);

    // O chat ativo inclui a mensagem original e as respostas
    const activeThread = messages
        .filter(m => m.id === selectedTicketId || m.parent_id === selectedTicketId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const activeTicket = parentTickets.find(t => t.id === selectedTicketId);
    const activeAlert = alerts.find(a => a.id === selectedAlertId);

    // --- AÇÕES DO SUPORTE ---
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
            fetchUnreadCount();
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
            fetchUnreadCount();
            loadTickets();
        } catch (error) {
            toast.error("Erro ao resolver ticket.");
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">

            {/* COLUNA ESQUERDA: NAVEGAÇÃO E LISTAS */}
            <InboxSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
                parentTickets={filteredTickets}
                alerts={alerts}
                selectedTicketId={selectedTicketId}
                setSelectedTicketId={setSelectedTicketId}
                selectedAlertId={selectedAlertId}
                setSelectedAlertId={setSelectedAlertId}
                filters={{
                    searchTerm, setSearchTerm,
                    statusFilter, setStatusFilter,
                    selectedCompanyId, setSelectedCompanyId,
                    sortOrder, setSortOrder,
                    companies
                }}
            />

            {/* COLUNA DIREITA: VISUALIZAÇÃO E AÇÕES */}
            <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                {activeTab === 'alerts' ? (
                    <BroadcastViewer
                        activeAlert={activeAlert}
                        onClearSelection={() => setSelectedAlertId(null)}
                        onOpenModal={() => setIsBroadcastModalOpen(true)}
                    />
                ) : (
                    <TicketConversation
                        activeTicket={activeTicket}
                        activeThread={activeThread}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        handleReply={handleReply}
                        handleResolve={handleResolve}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>

            {/* MODAL ISOLADO */}
            <NewBroadcastModal
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                onSuccess={loadAlerts}
            />
        </div>
    );
}