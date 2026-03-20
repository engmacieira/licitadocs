import { ArrowLeft, Clock, CheckCircle2, Send } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

/**
 * Propriedades do componente TicketChat.
 * @interface TicketChatProps
 */
interface TicketChatProps {
    activeTicket: any;
    activeThread: any[];
    replyText: string;
    setReplyText: (text: string) => void;
    handleReply: (e: React.FormEvent) => void;
    isReplying: boolean;
    onBack: () => void;
}

/**
 * Componente que renderiza a conversa de um chamado (Ticket) selecionado,
 * permitindo ao cliente enviar respostas para a equipa técnica.
 */
export function TicketChat({ activeTicket, activeThread, replyText, setReplyText, handleReply, isReplying, onBack }: TicketChatProps) {
    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
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
                            <div className={`max-w-[80%] p-4 text-sm shadow-sm rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
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
    );
}