import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
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
            content: 'Olá! Sou seu Consultor de Licitações com IA. ✨\nPosso ajudar a analisar seus editais, documentos ou tirar dúvidas sobre o sistema.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll inteligente
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const text = inputValue.trim();
        setInputValue('');

        // 1. Optimistic UI: Adiciona mensagem do usuário
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: text }]);
        setLoading(true);

        try {
            // 2. Chama a API
            const data = await aiService.sendMessage(text);

            // 3. Resposta da IA
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: data.response
            }]);

        } catch (error) {
            console.error(error);
            toast.error("Assistente indisponível.");
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: <span className="text-red-500 font-medium">Desculpe, tive um problema de conexão. Pode tentar novamente?</span>
            }]);
        } finally {
            setLoading(false);
        }
    }

    // Controla o Enter para enviar e Shift+Enter para quebrar linha
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Evita que crie uma linha nova
            handleSendMessage(e as any); // Dispara a submissão do formulário
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">

            {/* JANELA DO CHAT */}
            {isOpen && (
                <div className="bg-white w-[340px] md:w-[400px] h-[550px] rounded-2xl shadow-2xl shadow-purple-900/20 flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">

                    {/* Header Premium */}
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-linear-to-br from-purple-500 to-blue-500 p-2 rounded-xl shadow-inner">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide">Assistente IA</h3>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Online e pronto
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Lista de Mensagens */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 scroll-smooth custom-scrollbar">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {/* Loading State (IA Pensando com os 3 pontinhos) */}
                        {loading && (
                            <div className="flex gap-3 items-end animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area (Estilo Textarea Auto-Resize) */}
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                        <form onSubmit={handleSendMessage} className="relative flex items-end">
                            <textarea
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    // Truque mágico para a caixa crescer com o texto
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                placeholder="Pergunte ao assistente..."
                                rows={1}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100 placeholder:text-slate-400 resize-none overflow-y-auto custom-scrollbar"
                                style={{ minHeight: '46px', maxHeight: '120px' }}
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputValue.trim()}
                                className="absolute right-1.5 bottom-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2 rounded-xl transition-colors shadow-sm"
                            >
                                <Send size={18} className={loading ? 'opacity-50' : 'ml-0.5'} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* BOTÃO FLUTUANTE (Trigger) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-xl transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center justify-center z-50 ${isOpen
                    ? 'bg-slate-800 rotate-90 hover:bg-slate-900'
                    : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30'
                    } text-white`}
                aria-label={isOpen ? "Fechar chat" : "Abrir Consultor IA"}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </div>
    );
}

// --- SUB-COMPONENTE: Bolha de Mensagem ---
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.type === 'user';

    return (
        <div className={`flex gap-3 items-end ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>

            {/* Avatar da IA (O utilizador não precisa de avatar para ficar mais limpo) */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={14} className="text-white" />
                </div>
            )}

            {/* Balão de Texto */}
            <div
                className={`max-w-[85%] p-4 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-slate-800 text-white rounded-2xl rounded-br-sm' // Dark mode para o User
                    : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm' // Branco limpo para a IA
                    }`}
            >
                {message.content}
            </div>
        </div>
    );
}