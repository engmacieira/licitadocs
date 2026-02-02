import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, type: 'bot', content: 'Olá! Sou seu Concierge Virtual. Analisei seu cofre e estou pronto para tirar dúvidas sobre seus documentos.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    async function handleSendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userMsg = inputValue;
        setInputValue(''); // Limpa input

        // Adiciona mensagem do usuário na tela
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Chama a API que consulta o banco (o "Bibliotecário")
            const response = await api.post('/ai/chat', { message: userMsg });

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: response.data.response
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Desculpe, tive um problema de conexão. Tente novamente.'
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* Janela do Chat (Só aparece se isOpen = true) */}
            {isOpen && (
                <div className="bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">

                    {/* Header */}
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-500 p-1.5 rounded-lg">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Concierge LicitaDoc</h3>
                                <p className="text-xs text-slate-400">Inteligência Contextual</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Área de Mensagens */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-200 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs text-gray-500">
                                    <Loader2 size={14} className="animate-spin" />
                                    Analisando documentos...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Pergunte sobre seus documentos..."
                            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Botão Flutuante (O Gatilho) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${isOpen ? 'bg-gray-500 rotate-90' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}