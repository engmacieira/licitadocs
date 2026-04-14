import { useEffect, useState } from 'react';
import { Landmark, LinkIcon, AlertCircle, Phone, Mail } from 'lucide-react';
import { emissionRuleService } from '../../../services/emissionRuleService';
import type { EmissionRuleDTO } from '../../../types';
import { Skeleton } from '../../../components/ui/Skeleton';

/**
 * Propriedades para o componente EmissionLinkDisplay.
 * @interface EmissionLinkDisplayProps
 */
interface EmissionLinkDisplayProps {
    documentTypeId: string | null;
    companyId: string;
}

/**
 * Componente inteligente que resolve e exibe a regra de emissão (link ou contato)
 * apropriada baseada no tipo de documento e no estado/município da empresa.
 */
export function EmissionLinkDisplay({ documentTypeId, companyId }: EmissionLinkDisplayProps) {
    const [rule, setRule] = useState<EmissionRuleDTO | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (documentTypeId && companyId) {
            setLoading(true);
            setRule(null);
            emissionRuleService.resolveLink(documentTypeId, companyId)
                .then(data => setRule(data))
                .finally(() => setLoading(false));
        } else {
            setRule(null);
        }
    }, [documentTypeId, companyId]);

    if (!documentTypeId) return null;

    return (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 min-h-[140px] flex flex-col">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3 border-b border-slate-100 pb-2">
                <Landmark className="h-4 w-4 text-blue-500" />
                <span>Onde Emitir / Consultar</span>
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    <Skeleton className="h-5 w-full rounded" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ) : rule ? (
                <div className="space-y-4">
                    {rule.emission_link ? (
                        <a
                            href={rule.emission_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm group"
                        >
                            <LinkIcon className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium flex-1 line-clamp-1">{rule.emission_link}</span>
                            <span className="text-xs text-blue-500 opacity-70">Abrir Portal</span>
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() => window.open(`/admin/manual-emission/${rule.id}`, '_blank')}
                            className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 hover:bg-amber-100 transition-all text-left w-full group shadow-sm cursor-pointer"
                        >
                            <AlertCircle className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                                <span className="text-sm font-bold block">Exige Solicitação Manual</span>
                                <span className="text-xs opacity-80 block mt-0.5">Clique aqui para abrir a Central de Emissão e acionar a prefeitura.</span>
                            </div>
                        </button>
                    )}

                    {(rule.contact_email || rule.contact_phone || rule.contact_whatsapp || rule.operation_notes) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 text-slate-600">
                            {rule.contact_email && <div className="flex items-center gap-1.5 line-clamp-1"><Mail size={14} className="text-slate-400" /> {rule.contact_email}</div>}
                            {rule.contact_phone && <div className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {rule.contact_phone}</div>}
                            {rule.contact_whatsapp && <div className="flex items-center gap-1.5 text-green-600 font-medium"><LinkIcon size={14} /> WhatsApp {rule.contact_whatsapp}</div>}
                            {rule.operation_notes && <div className="col-span-1 sm:col-span-3 text-amber-700 bg-amber-50 p-2 rounded">Nota: {rule.operation_notes}</div>}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center py-4 px-2 border border-dashed border-slate-200 rounded-lg bg-white h-full">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                    <span className="text-sm font-medium text-slate-600">Padrão de Emissão Não Encontrado</span>
                    <p className="text-xs text-slate-500 max-w-xs">Não localizámos uma regra de emissão (link/contacto) cadastrada para o endereço desta empresa.</p>
                </div>
            )}
        </div>
    );
}