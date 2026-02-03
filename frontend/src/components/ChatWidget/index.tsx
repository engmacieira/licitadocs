import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { aiService } from '../../services/aiService'; // Usando o Service
import { Skeleton } from '../ui/Skeleton'; // Usando o Skeleton
import { toast } from 'sonner';

interface Message {
    id: number;
    type: 'user' | 'bot';
    content: React.ReactNode; // Alterado para aceitar componentes (como o Skeleton)
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'bot',
            content: 'Olá! Sou seu Concierge Virtual. Analisei seu cofre e estou pronto para tirar dúvidas sobre seus documentos.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll sempre que chegar mensagem nova ou abrir o chat
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function handleSendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userMsgText = inputValue;
        setInputValue(''); // Limpa input imediatamente (UX rápida)

        // 1. Adiciona mensagem do usuário na tela
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: userMsgText }]);
        setLoading(true);

        try {
            // 2. Chama o serviço (o "Cérebro")
            const data = await aiService.sendMessage(userMsgText);

            // 3. Adiciona resposta da IA
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: data.response // O service já retorna o objeto correto
            }]);

        } catch (error) {
            console.error(error);
            // UX: Feedback visual de erro
            toast.error("Não foi possível conectar com o Concierge.", {
                description: "Tente novamente em alguns instantes."
            });

            // Opcional: Adicionar mensagem de erro no chat também
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: <span className="text-red-500">Desculpe, tive um problema de conexão. Poderia repetir?</span>
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Janela do Chat */}
            {isOpen && (
                <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Concierge IA</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-100 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Área de Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-purple-600'
                                    }`}>
                                    {msg.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>

                                {/* Balão */}
                                <div
                                    className={`max-w-[80%] p-3 text-sm rounded-2xl shadow-sm ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Skeleton de Carregamento (IA Pensando) */}
                        {loading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                    <Bot size={14} className="text-purple-400" />
                                </div>
                                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2 max-w-[80%]">
                                    <Skeleton className="h-3 w-32 bg-slate-100" />
                                    <Skeleton className="h-3 w-20 bg-slate-100" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Pergunte sobre seus documentos..."
                            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Botão Flutuante (Trigger) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen
                    ? 'bg-gray-700 rotate-90 hover:bg-gray-800'
                    : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    } text-white flex items-center justify-center`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}