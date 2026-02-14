import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Skeleton } from '../ui/Skeleton';
import { toast } from 'sonner';

// Tipagem local para as mensagens
interface Message {
    id: number;
    type: 'user' | 'bot';
    content: React.ReactNode;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'bot',
            content: 'Olá! Sou seu Concierge Virtual. 🤖\nPosso ajudar a analisar seus documentos ou tirar dúvidas sobre o sistema.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll inteligente: Sempre que mensagens mudarem ou o chat abrir
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const text = inputValue.trim();
        setInputValue(''); // Limpa input imediatamente (UX rápida)

        // 1. Optimistic UI: Adiciona mensagem do usuário instantaneamente
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: text }]);
        setLoading(true);

        try {
            // 2. Chama o "Cérebro"
            const data = await aiService.sendMessage(text);

            // 3. Resposta da IA
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: data.response
            }]);

        } catch (error) {
            console.error(error);
            toast.error("Concierge indisponível.", {
                description: "Tente novamente mais tarde."
            });

            // Feedback visual no chat também
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: <span className="text-red-500 text-xs">Erro de conexão. Por favor, tente novamente.</span>
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">

            {/* JANELA DO CHAT */}
            {isOpen && (
                <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Concierge IA</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-100 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                            aria-label="Fechar chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Lista de Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {/* Loading State (IA Pensando) */}
                        {loading && (
                            <div className="flex gap-3 animate-pulse items-end">
                                <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mb-1">
                                    <Sparkles size={14} className="text-purple-500" />
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2 max-w-[80%]">
                                    <Skeleton className="h-2 w-24 bg-slate-100" />
                                    <Skeleton className="h-2 w-16 bg-slate-100" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Digite sua dúvida..."
                            className="flex-1 bg-slate-100/80 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center"
                            aria-label="Enviar mensagem"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* BOTÃO FLUTUANTE (Trigger) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-xl transition-all duration-500 transform hover:scale-110 active:scale-95 flex items-center justify-center z-50 ${isOpen
                    ? 'bg-slate-700 rotate-90 hover:bg-slate-800'
                    : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-500/30'
                    } text-white`}
                aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}

// --- SUB-COMPONENTE: Bolha de Mensagem (Clean Code & Performance) ---
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.type === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${isUser
                ? 'bg-blue-50 border-blue-100 text-blue-600'
                : 'bg-white border-slate-200 text-purple-600'
                }`}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Balão de Texto */}
            <div
                className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}
            >
                {message.content}
            </div>
        </div>
    );
}