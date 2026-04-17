import { CONTACT_CONFIG, APP_CONFIG } from "../../../config/app.config";
import { Phone, Mail, MapPin, Clock, CheckCircle2, Calendar } from 'lucide-react';

/**
 * Componente visual que exibe a barra lateral da Central de Ajuda.
 * Contém os canais de contacto direto com o suporte e os horários de atendimento.
 */
export function ContactSidebar() {
    return (
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" /> Fale Conosco
                </h3>
                <div className="space-y-4">
                    <ContactItem icon={Mail} label="E-mail de Suporte" value={CONTACT_CONFIG.supportEmail} />
                    <ContactItem icon={Phone} label="WhatsApp" value={CONTACT_CONFIG.whatsapp.display} />
                    <ContactItem icon={MapPin} label="Sede" value={APP_CONFIG.address} />
                </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-600" /> Horário de Atendimento
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <strong>Segunda a Sexta:</strong> 08h00 às 18h00
                    </p>
                    <div className="pt-3 border-t border-slate-200">
                        <p className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Calendário de Feriados
                        </p>
                        <p className="text-xs leading-relaxed">
                            O suporte e a contagem de prazos são suspensos durante feriados Nacionais, Estaduais (MG) e Municipais (Braúnas/MG).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponente local
function ContactItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon size={18} /></div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}
