import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { emissionRuleService } from '../../../services/emissionRuleService';
import type { EmissionRuleCreatePayload, EmissionRuleDTO } from '@/types';
import type { DocumentTypeDTO } from '@/types';
import type { ScopeTab } from '../RulesOrchestrator';

interface IBGEUF { sigla: string; nome: string; }
interface IBGECity { nome: string; }

/**
 * Propriedades do Modal de Regras de Emissão.
 * @interface RuleModalProps
 */
interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    activeTab: ScopeTab;
    editingRule: EmissionRuleDTO | null;
    docTypes: DocumentTypeDTO[];
}

/**
 * Modal inteligente para criar ou editar Diretórios de Emissão.
 * Incorpora a lógica de integração com a API do IBGE (Estados e Municípios),
 * isolando essa carga de rede do restante da aplicação.
 */
export function RuleModal({ isOpen, onClose, onSuccess, activeTab, editingRule, docTypes }: RuleModalProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<EmissionRuleCreatePayload>();
    const selectedState = watch('state');

    const [ufs, setUfs] = useState<IBGEUF[]>([]);
    const [ibgeCities, setIbgeCities] = useState<IBGECity[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    /** Prepara os dados iniciais do modal ao abrir. */
    useEffect(() => {
        if (isOpen && editingRule && ufs.length > 0) {
            setValue('state', editingRule.state || '');
        }
    }, [isOpen, editingRule, ufs, setValue]);

    useEffect(() => {
        if (isOpen && editingRule && ibgeCities.length > 0) {
            setValue('city', editingRule.city || '');
        }
    }, [isOpen, editingRule, ibgeCities, setValue]);

    useEffect(() => {
        if (isOpen) {
            if (editingRule) {
                reset({
                    document_type_id: editingRule.document_type_id,
                    state: editingRule.state || '',
                    city: editingRule.city || '',
                    emission_link: editingRule.emission_link || '',
                    contact_email: editingRule.contact_email || '',
                    contact_phone: editingRule.contact_phone || '',
                    contact_whatsapp: editingRule.contact_whatsapp || '',
                    operation_notes: editingRule.operation_notes || '',
                });
            } else {
                reset({
                    document_type_id: '',
                    state: '',
                    city: '',
                    emission_link: '',
                    contact_email: '',
                    contact_phone: '',
                    contact_whatsapp: '',
                    operation_notes: '',
                });
            }

            // Otimização: Só carrega UFs se necessário
            if (activeTab === 'STATE' || activeTab === 'MUNICIPAL') {
                loadUFs();
            }
        }
    }, [isOpen, editingRule, activeTab, reset]);

    /** Carrega Municípios sempre que um Estado é selecionado (se a aba for municipal). */
    useEffect(() => {
        if (!selectedState || activeTab !== 'MUNICIPAL') {
            setIbgeCities([]);
            return;
        }
        async function loadCities() {
            try {
                const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`);
                setIbgeCities(await res.json());
            } catch {
                toast.error("Erro ao carregar municípios do IBGE.");
            }
        }
        loadCities();
    }, [selectedState, activeTab]);

    async function loadUFs() {
        try {
            const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            setUfs(await res.json());
        } catch {
            toast.error("Erro ao carregar estados do IBGE.");
        }
    }

    /** Trata a submissão, limpando campos incompatíveis com o escopo e normalizando dados. */
    const onSubmit = async (data: EmissionRuleCreatePayload) => {
        setIsSaving(true);
        try {
            const payload = { ...data };

            // Limpa dados geográficos incorretos baseados no escopo atual
            if (activeTab === 'NATIONAL') {
                payload.state = undefined;
                payload.city = undefined;
            }
            if (activeTab === 'STATE') {
                payload.city = undefined;
            }

            // Normaliza strings vazias para undefined (Exigência do backend/Pydantic)
            if (!payload.emission_link) payload.emission_link = undefined;
            if (!payload.contact_email) payload.contact_email = undefined;
            if (!payload.contact_phone) payload.contact_phone = undefined;
            if (!payload.contact_whatsapp) payload.contact_whatsapp = undefined;
            if (!payload.operation_notes) payload.operation_notes = undefined;

            if (editingRule) {
                await emissionRuleService.update(editingRule.id, payload);
                toast.success("Regra atualizada com sucesso!");
            } else {
                await emissionRuleService.create(payload);
                toast.success("Regra cadastrada com sucesso!");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                const fieldName = detail[0].loc[detail[0].loc.length - 1];
                toast.error(`Verifique o campo "${fieldName}": ${detail[0].msg}`);
            } else if (typeof detail === 'string') {
                toast.error(detail);
            } else {
                toast.error("Erro ao salvar a regra de emissão.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">
                        {editingRule ? 'Editar Regra' : `Nova Regra ${activeTab === 'NATIONAL' ? 'Nacional' : activeTab === 'STATE' ? 'Estadual' : 'Municipal'}`}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label htmlFor="rule-doc-type" className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Documento *</label>
                        <select
                            className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            {...register('document_type_id', { required: true })}
                            id="rule-doc-type"
                        >
                            <option value="">Selecione o documento exigido...</option>
                            {docTypes.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                    </div>

                    {(activeTab === 'STATE' || activeTab === 'MUNICIPAL') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                                <label htmlFor="rule-state" className="text-sm font-medium text-slate-700 mb-1 block">Estado (UF) *</label>
                                <select
                                    className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    {...register('state', { required: true })}
                                    id="rule-state"
                                >
                                    <option value="">Selecione...</option>
                                    {ufs.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
                                </select>
                            </div>
                            {activeTab === 'MUNICIPAL' && (
                                <div>
                                    <label htmlFor="rule-city" className="text-sm font-medium text-slate-700 mb-1 block">Município *</label>
                                    <select
                                        className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                                        {...register('city', { required: true })}
                                        id="rule-city"
                                        disabled={!selectedState}
                                    >
                                        <option value="">{selectedState ? "Selecione..." : "Selecione UF primeiro"}</option>
                                        {ibgeCities.map(city => <option key={city.nome} value={city.nome}>{city.nome}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Detalhes Operacionais</h3>
                        <Input label="Portal Web (Link de Emissão)" placeholder="https://..." {...register('emission_link')} id="rule-emission-link" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input label="E-mail de Contato" placeholder="email@orgao.gov.br" {...register('contact_email')} id="rule-contact-email" />
                            <Input label="Telefone" placeholder="(00) 0000-0000" {...register('contact_phone')} id="rule-contact-phone" />
                            <Input label="WhatsApp" placeholder="(00) 90000-0000" {...register('contact_whatsapp')} id="rule-contact-whatsapp" />
                        </div>

                        <div>
                            <label htmlFor="rule-notes" className="text-sm font-medium text-slate-700 mb-1 block">Instruções Manuais (Notas)</label>
                            <textarea
                                placeholder="Ex: Para emitir, precisa enviar e-mail com o Contrato Social em anexo..."
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                                {...register('operation_notes')}
                                id="rule-notes"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" isLoading={isSaving} className="bg-blue-600 hover:bg-blue-700 shadow-sm min-w-[140px]">
                            {editingRule ? 'Guardar' : 'Criar Regra'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}