import { useState } from 'react';
import { toast } from 'sonner';
import { X, Send, MessageSquare } from 'lucide-react';

import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

/**
 * Propriedades do modal NewTicketModal.
 * @interface NewTicketModalProps
 */
interface NewTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * Modal flutuante que permite ao cliente abrir um novo ticket de suporte
 * endereçado à equipa administrativa.
 */
export function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
    const { currentCompany } = useAuth();
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !content.trim()) {
            toast.error("Preencha todos os campos", { description: "O assunto e a mensagem são obrigatórios." });
            return;
        }

        if (!currentCompany?.id) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Enviando chamado...");

        try {
            await api.post(`/messages/${currentCompany.id}`, {
                subject: subject,
                content: content,
                message_type: 'chat'
            });

            toast.success("Chamado aberto com sucesso!", { id: toastId });
            setSubject('');
            setContent('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao abrir o chamado.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" /> Abrir Novo Chamado
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <p className="text-sm text-slate-500 mb-2">
                        Descreva sua dúvida ou problema. Nossa equipe técnica responderá o mais rápido possível dentro do horário comercial.
                    </p>
                    <Input
                        label="Assunto Principal"
                        placeholder="Ex: Dúvida sobre certidão, Erro no sistema..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        autoFocus
                    />
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Mensagem Detalhada</label>
                        <textarea
                            className="w-full rounded-lg border-slate-300 py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-y"
                            placeholder="Descreva com detalhes o que você precisa..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </form>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} isLoading={isSubmitting}><Send className="h-4 w-4 mr-2" /> Enviar Ticket</Button>
                </div>
            </div>
        </div>
    );
}