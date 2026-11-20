import { useState } from 'react';
import { AlertTriangle, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { PncpLeadContactRequest, PncpLeadResponse } from '../../../types';
import { CONTACT_CHANNELS, formatCnpj, formatLastContactDate } from './leadFormatters';

interface ContactLeadModalProps {
    lead: PncpLeadResponse;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (leadId: string, payload: PncpLeadContactRequest) => Promise<void>;
}

export function ContactLeadModal({
    lead,
    isSubmitting,
    onClose,
    onSubmit,
}: ContactLeadModalProps) {
    const [channel, setChannel] = useState<string>('whatsapp');
    const [notes, setNotes] = useState<string>('');
    const [cooldownDays, setCooldownDays] = useState<string>(String(lead.spam_cooldown_days || 7));

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsedCooldown = Number.parseInt(cooldownDays, 10);
        await onSubmit(lead.id, {
            channel,
            notes: notes.trim() || null,
            cooldown_days: Number.isNaN(parsedCooldown) ? undefined : parsedCooldown,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-lead-modal-title"
        >
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <MessageSquarePlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="contact-lead-modal-title" className="text-lg font-semibold text-slate-900">
                                Registrar Contato
                            </h2>
                            <p className="text-xs text-slate-500">
                                {lead.razao_social} • {formatCnpj(lead.cnpj)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                    {lead.is_in_cooldown && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm"
                        >
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Alerta Anti-SPAM: Lead em Cooldown</p>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    Este lead foi contatado em {formatLastContactDate(lead.last_contacted_at)} e ainda possui{' '}
                                    <strong>
                                        {lead.cooldown_remaining_days}{' '}
                                        {lead.cooldown_remaining_days === 1 ? 'dia restante' : 'dias restantes'}
                                    </strong>{' '}
                                    na janela de proteção ({lead.spam_cooldown_days} dias).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="contact-channel" className="text-sm font-medium text-slate-700">
                            Canal de Contato
                        </label>
                        <select
                            id="contact-channel"
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            required
                        >
                            {CONTACT_CHANNELS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        id="contact-cooldown-days"
                        label="Janela de Cooldown Anti-SPAM (dias)"
                        type="number"
                        min={0}
                        max={365}
                        value={cooldownDays}
                        onChange={(e) => setCooldownDays(e.target.value)}
                        helperText="Define por quantos dias este lead ficará sinalizado em cooldown após o contato."
                    />

                    <div className="space-y-1.5">
                        <label htmlFor="contact-notes" className="text-sm font-medium text-slate-700">
                            Observações do Contato
                        </label>
                        <textarea
                            id="contact-notes"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Resumo da abordagem, retorno do decisor ou próximo passo..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            Salvar Contato
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
