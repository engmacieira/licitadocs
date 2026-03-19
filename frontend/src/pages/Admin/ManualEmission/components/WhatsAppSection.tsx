import { Phone, Send } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { EmissionRuleDTO } from '../../../../services/emissionRuleService';

interface WhatsAppSectionProps {
    rule: EmissionRuleDTO;
    selectedCompanyId: string;
    whatsappBody: string;
    setWhatsappBody: (val: string) => void;
    handleSendWhatsApp: () => void;
    isSendingWhatsApp: boolean;
}

export function WhatsAppSection({
    rule, selectedCompanyId, whatsappBody, setWhatsappBody, handleSendWhatsApp, isSendingWhatsApp
}: WhatsAppSectionProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-green-500" /> 2. Cobrança via WhatsApp
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Número do WhatsApp</label>
                    <input type="text" readOnly value={rule.contact_whatsapp || "Nenhum WhatsApp cadastrado nesta regra"} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Mensagem de Cobrança</label>
                    <textarea value={whatsappBody} onChange={e => setWhatsappBody(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-lg text-sm h-48 resize-none focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <Button onClick={handleSendWhatsApp} isLoading={isSendingWhatsApp} disabled={!rule.contact_whatsapp || !selectedCompanyId} className="w-full bg-green-600 hover:bg-green-700 h-11 text-base">
                    <Send className="h-4 w-4 mr-2" /> Agendar Mensagem
                </Button>
            </div>
        </div>
    );
}