import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Send, Megaphone, AlertTriangle, Building2 } from 'lucide-react';

import api from '../../../../services/api';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

interface NewBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewBroadcastModal({ isOpen, onClose, onSuccess }: NewBroadcastModalProps) {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sendToAll, setSendToAll] = useState(true);

    // Lista de empresas para seleção caso não seja envio em massa
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && !sendToAll && companies.length === 0) {
            loadCompanies();
        }
    }, [isOpen, sendToAll]);

    const loadCompanies = async () => {
        try {
            // Assumindo que tem uma rota que lista as empresas para o Admin
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            toast.error("Erro ao carregar a lista de empresas.");
        }
    };

    const toggleCompanySelection = (id: string) => {
        setSelectedCompanyIds(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !content.trim()) {
            toast.error("Preencha o assunto e a mensagem.");
            return;
        }

        if (!sendToAll && selectedCompanyIds.length === 0) {
            toast.error("Selecione pelo menos uma empresa destinatária.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("A disparar aviso...");

        try {
            await api.post('/messages/admin/broadcast', {
                subject: subject,
                content: content,
                send_to_all: sendToAll,
                company_ids: selectedCompanyIds
            });

            toast.success("Aviso enviado com sucesso!", { id: toastId });

            // Limpa o formulário
            setSubject('');
            setContent('');
            setSendToAll(true);
            setSelectedCompanyIds([]);

            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Erro ao enviar o aviso.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabeçalho */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-purple-600" /> Disparar Aviso do Sistema
                    </h3>
                    <button onClick={onClose} className="text-purple-400 hover:text-purple-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

                    <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3 border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Atenção:</strong> Estes avisos são de leitura unidirecional. O cliente poderá ler e marcar como visto, mas não poderá responder criando um chat. Use para comunicados, atualizações de sistema ou cobranças.
                        </p>
                    </div>

                    <Input
                        label="Assunto do Aviso"
                        placeholder="Ex: Manutenção Programada no Sistema"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        autoFocus
                    />

                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Conteúdo do Aviso</label>
                        <textarea
                            className="w-full rounded-lg border-slate-300 py-3 px-4 text-sm focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-y"
                            placeholder="Escreva a mensagem que os clientes irão ler..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* Área de Destinatários */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="text-sm font-medium text-slate-700 block mb-3">Destinatários</label>

                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={sendToAll}
                                    onChange={() => setSendToAll(true)}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-700">Todas as Empresas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!sendToAll}
                                    onChange={() => setSendToAll(false)}
                                    className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-700">Selecionar Específicas</span>
                            </label>
                        </div>

                        {/* Tabela de seleção manual se não for para todos */}
                        {!sendToAll && (
                            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                                {companies.length === 0 ? (
                                    <p className="p-4 text-xs text-slate-500 text-center">A carregar empresas...</p>
                                ) : (
                                    companies.map(company => (
                                        <label key={company.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCompanyIds.includes(company.id)}
                                                onChange={() => toggleCompanySelection(company.id)}
                                                className="rounded text-purple-600 focus:ring-purple-500"
                                            />
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-700">{company.razao_social}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </form>

                {/* Ações */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                        <Send className="h-4 w-4 mr-2" /> Disparar Aviso
                    </Button>
                </div>
            </div>
        </div>
    );
}