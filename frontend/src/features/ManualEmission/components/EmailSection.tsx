import { Mail, Paperclip, Send } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { EmissionRuleDTO } from '@/types';

/**
 * Propriedades do componente EmailSection.
 * @interface EmailSectionProps
 */
interface EmailSectionProps {
    rule: EmissionRuleDTO;
    selectedCompanyId: string;
    emailSubject: string;
    setEmailSubject: (val: string) => void;
    emailBody: string;
    setEmailBody: (val: string) => void;
    handleSendEmail: () => void;
    isSendingEmail: boolean;
}

/**
 * Painel visual para edição e disparo do requerimento de certidão por e-mail.
 * Exibe os templates gerados pelo orquestrador e a checklist de anexos obrigatórios.
 */
export function EmailSection({
    rule, selectedCompanyId, emailSubject, setEmailSubject,
    emailBody, setEmailBody, handleSendEmail, isSendingEmail
}: EmailSectionProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-blue-500" /> 1. Disparo de E-mail
            </h2>

            <div className="space-y-4 flex-1">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Para (E-mail da Prefeitura)</label>
                    <input type="text" readOnly value={rule.contact_email || "Nenhum e-mail cadastrado nesta regra"} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Assunto</label>
                    <textarea value={emailSubject} onChange={e => setEmailSubject(e.target.value)} rows={2} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold resize-none" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Corpo do E-mail</label>
                    <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-lg text-sm h-64 resize-y focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> Anexos Obrigatórios
                    </h3>
                    <div className="space-y-3">
                        {['01. Cartão CNPJ', '02. Contrato Social', '03. Procuração do Representante', '04. Documento de Identificação (Procurador)'].map((label, idx) => (
                            <div key={idx}>
                                <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
                                <input type="file" accept=".pdf,image/*" className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={handleSendEmail} isLoading={isSendingEmail} disabled={!rule.contact_email || !selectedCompanyId} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-11 text-base">
                <Send className="h-4 w-4 mr-2" /> Enviar E-mail e Registar Histórico
            </Button>
        </div>
    );
}