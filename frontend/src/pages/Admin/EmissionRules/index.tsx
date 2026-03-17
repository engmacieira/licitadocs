import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { MapPin, Search, Plus, Edit, Trash2, Link as LinkIcon, Mail, FileText, X, Globe, Building, Landmark } from 'lucide-react';

import { emissionRuleService } from '../../../services/emissionRuleService';
import { documentService } from '../../../services/documentService';
import type { EmissionRuleDTO, EmissionRuleCreatePayload } from '../../../services/emissionRuleService';
import type { DocumentTypeDTO } from '../../../services/documentService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';

// Interfaces IBGE
interface IBGEUF { sigla: string; nome: string; }
interface IBGECity { nome: string; }

type ScopeTab = 'NATIONAL' | 'STATE' | 'MUNICIPAL';

export function AdminEmissionRulesPage() {
    const [rules, setRules] = useState<EmissionRuleDTO[]>([]);
    const [docTypes, setDocTypes] = useState<DocumentTypeDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<ScopeTab>('MUNICIPAL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<EmissionRuleDTO | null>(null);

    const [ufs, setUfs] = useState<IBGEUF[]>([]);
    const [ibgeCities, setIbgeCities] = useState<IBGECity[]>([]);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EmissionRuleCreatePayload>();
    const selectedState = watch('state');

    useEffect(() => {
        loadData();
        loadUFs();
    }, []);

    useEffect(() => {
        if (!selectedState || activeTab === 'NATIONAL') {
            setIbgeCities([]);
            return;
        }
        async function loadCities() {
            try {
                const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`);
                setIbgeCities(await res.json());
            } catch {
                toast.error("Erro ao carregar municípios.");
            }
        }
        loadCities();
    }, [selectedState, activeTab]);

    async function loadData() {
        setLoading(true);
        try {
            const [rulesData, categoriesData] = await Promise.all([
                emissionRuleService.getAll(),
                documentService.getTypes() // Retorna DocumentCategoryDTO[]
            ]);

            setRules(rulesData);

            // O truque aqui: extrai todos os 'types' de dentro das categorias
            // e junta (achata) tudo numa única lista de DocumentTypeDTO[]
            const allTypes = categoriesData.flatMap((category: any) => category.types || []);
            setDocTypes(allTypes);

        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    async function loadUFs() {
        try {
            const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            setUfs(await res.json());
        } catch {
            toast.error("Erro ao carregar estados do IBGE.");
        }
    }

    // Filtra os documentos pelo Escopo da aba atual para exibir no Select do modal
    const currentScopeDocTypes = useMemo(() => {
        return docTypes.filter(doc => doc.scope === activeTab);
    }, [docTypes, activeTab]);

    // Cruza as regras com o tipo de documento para saber a qual aba elas pertencem
    const filteredRules = useMemo(() => {
        return rules.filter(rule => {
            const doc = docTypes.find(d => d.id === rule.document_type_id);
            if (doc?.scope !== activeTab) return false;

            const term = searchTerm.toLowerCase();
            return (
                rule.document_type_name?.toLowerCase().includes(term) ||
                rule.city?.toLowerCase().includes(term) ||
                rule.state?.toLowerCase().includes(term)
            );
        });
    }, [rules, docTypes, activeTab, searchTerm]);

    const openModal = (rule?: EmissionRuleDTO) => {
        reset();
        if (rule) {
            setEditingRule(rule);
            setValue('document_type_id', rule.document_type_id);
            if (rule.state) setValue('state', rule.state);
            setTimeout(() => { if (rule.city) setValue('city', rule.city); }, 300);
            setValue('emission_link', rule.emission_link || '');
            setValue('contact_email', rule.contact_email || '');
            setValue('contact_phone', rule.contact_phone || '');
            setValue('contact_whatsapp', rule.contact_whatsapp || '');
            setValue('operation_notes', rule.operation_notes || '');
        } else {
            setEditingRule(null);
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: EmissionRuleCreatePayload) => {
        try {
            // 1. Clonar os dados para podermos manipular
            const payload = { ...data };

            // 2. Limpar os campos de localização baseados na aba atual
            if (activeTab === 'NATIONAL') {
                payload.state = undefined;
                payload.city = undefined;
            }
            if (activeTab === 'STATE') {
                payload.city = undefined;
            }

            // 3. O Pydantic rejeita EmailStr se for string vazia "". 
            // Precisamos converter strings vazias para undefined para o backend aceitar.
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
            setIsModalOpen(false);
            loadData();

        } catch (error: any) {
            // 4. Prevenir o Crash do React ao ler erros de validação (422) do FastAPI
            const detail = error.response?.data?.detail;

            if (Array.isArray(detail)) {
                // Se for um array (Erro 422 do Pydantic), mostramos a primeira mensagem de forma amigável
                const fieldName = detail[0].loc[detail[0].loc.length - 1]; // Pega o nome do campo
                toast.error(`Verifique o campo "${fieldName}": ${detail[0].msg}`);
            } else if (typeof detail === 'string') {
                // Se for uma string (Erros disparados por nós, ex: "Já existe uma regra...")
                toast.error(detail);
            } else {
                // Fallback seguro
                toast.error("Erro ao salvar a regra de emissão.");
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Excluir este registo?")) return;
        try {
            await emissionRuleService.delete(id);
            toast.success("Excluído com sucesso.");
            loadData();
        } catch {
            toast.error("Erro ao excluir.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-blue-600" />
                        Diretórios de Emissão
                    </h1>
                    <p className="text-sm text-slate-500">
                        Gerencie links e contatos de emissão por abrangência.
                    </p>
                </div>
                <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Nova Regra
                </Button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('NATIONAL')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'NATIONAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Globe size={18} /> Nacional
                </button>
                <button
                    onClick={() => setActiveTab('STATE')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'STATE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Landmark size={18} /> Estadual
                </button>
                <button
                    onClick={() => setActiveTab('MUNICIPAL')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'MUNICIPAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Building size={18} /> Municipal
                </button>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-700">
                        Regras {activeTab === 'NATIONAL' ? 'Nacionais' : activeTab === 'STATE' ? 'Estaduais' : 'Municipais'}
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-6"><Skeleton className="h-16 w-full" /></div>
                ) : filteredRules.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">Nenhuma regra {activeTab.toLowerCase()} encontrada.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredRules.map(rule => (
                            <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-md flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        {rule.document_type_name}
                                    </h4>
                                    {(rule.state || rule.city) && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            {rule.city ? `${rule.city} - ${rule.state}` : `Estado: ${rule.state}`}
                                        </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-xs text-slate-600">
                                        {rule.emission_link && <span className="text-blue-600 flex items-center gap-1"><LinkIcon size={12} /> Portal Web</span>}
                                        {rule.contact_email && <span className="flex items-center gap-1"><Mail size={12} /> Email</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(rule)} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Nova Regra {activeTab}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-6">

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Documento *</label>
                                <select className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" {...register('document_type_id', { required: true })}>
                                    <option value="">Selecione o documento...</option>
                                    {currentScopeDocTypes.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {(activeTab === 'STATE' || activeTab === 'MUNICIPAL') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">UF *</label>
                                        <select className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" {...register('state', { required: true })}>
                                            <option value="">Selecione...</option>
                                            {ufs.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>)}
                                        </select>
                                    </div>
                                    {activeTab === 'MUNICIPAL' && (
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1 block">Cidade *</label>
                                            <select className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" {...register('city', { required: true })} disabled={!selectedState}>
                                                <option value="">{selectedState ? "Selecione..." : "Selecione UF primeiro"}</option>
                                                {ibgeCities.map(city => <option key={city.nome} value={city.nome}>{city.nome}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <hr className="border-slate-100" />

                            {/* Campos de Link e Contato (Iguais ao anterior) */}
                            <Input label="Link de Emissão" placeholder="https://..." {...register('emission_link')} />
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="E-mail" {...register('contact_email')} />
                                <Input label="Telefone" {...register('contact_phone')} />
                                <Input label="WhatsApp" {...register('contact_whatsapp')} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Notas</label>
                                <textarea className="w-full border rounded-lg p-2 text-sm h-20" {...register('operation_notes')} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar Regra</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}