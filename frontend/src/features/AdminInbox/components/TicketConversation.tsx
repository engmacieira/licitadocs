import { Link } from 'react-router-dom';
import { MessageSquare, Building2, ExternalLink, User, CheckCircle2, Clock, Send } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente TicketConversation.
 * @interface TicketConversationProps
 */
interface TicketConversationProps {
    activeTicket: any;
    activeThread: any[];
    replyText: string;
    setReplyText: (text: string) => void;
    handleReply: (e: React.FormEvent) => void;
    handleResolve: () => void;
    isSubmitting: boolean;
}

/**
 * Componente visual que renderiza a conversa de um ticket de suporte.
 * Exibe as mensagens trocadas, o botão para resolver o ticket e a área 
 * de texto para o administrador enviar uma nova resposta.
 */
export function TicketConversation({
    activeTicket, activeThread, replyText, setReplyText,
    handleReply, handleResolve, isSubmitting
}: TicketConversationProps) {
    if (!activeTicket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                <MessageSquare className="h-12 w-12 mb-4 text-slate-200" />
                <p>Selecione um ticket na lista ao lado para visualizar a conversa e responder.</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="font-bold text-slate-900">{activeTicket.subject || 'Sem Assunto'}</h2>
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
    );
}