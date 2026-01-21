import { useState, useRef, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

// Tipo para as mensagens da tela
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

export function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou seu Consultor Especialista em Licitações. Posso ajudar a identificar documentos ou tirar dúvidas sobre o edital. O que você precisa?',
            sender: 'ai'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function handleSend() {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue(''); // Limpa o campo

        // 1. Adiciona mensagem do usuário na tela
        const userMsg: Message = { id: Date.now().toString(), text: userText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);

        setLoading(true);

        try {
            // 2. Chama a IA
            const data = await aiService.sendMessage(userText);

            // 3. Adiciona resposta da IA
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Erro na IA:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                text: "Desculpe, estou tendo problemas para conectar com o servidor. Tente novamente.",
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {/* Header do Chat */}
            <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                    <Sparkles className="text-indigo-600" size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800">Consultor IA</h2>
                    <p className="text-xs text-slate-500">Especialista em Licitações</p>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Ícone */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                            ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>
                            {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        {/* Balão de Texto */}
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Indicador de "Digitando..." */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Área de Input */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <Input
                        placeholder="Ex: Qual documento comprova regularidade fiscal?"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button onClick={handleSend} disabled={loading || !inputValue.trim()}>
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    </Button>
                </div>
            </div>
        </div>
    );
}