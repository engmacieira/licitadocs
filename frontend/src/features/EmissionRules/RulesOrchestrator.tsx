import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';

// Serviços
import { emissionRuleService } from '../../services/emissionRuleService';
import { documentService } from '../../services/documentService';
import type { EmissionRuleDTO } from '../../services/emissionRuleService';
import type { DocumentTypeDTO } from '../../services/documentService';

// Componentes UI
import { Button } from '../../components/ui/Button';

// Subcomponentes da Feature
import { RulesTabs } from './components/RulesTabs';
import { RulesList } from './components/RulesList';
import { RuleModal } from './components/RuleModal';

/** Tipagem para os escopos das abas */
export type ScopeTab = 'NATIONAL' | 'STATE' | 'MUNICIPAL';

/**
 * Orquestrador da Gestão de Regras de Emissão.
 * Gere a busca paralela de regras e tipos de documento, controla o estado 
 * das abas e cruza os dados para alimentar a listagem visual.
 */
export function RulesOrchestrator() {
    // --- ESTADOS DE DADOS ---
    const [rules, setRules] = useState<EmissionRuleDTO[]>([]);
    const [docTypes, setDocTypes] = useState<DocumentTypeDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE UI E FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<ScopeTab>('MUNICIPAL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<EmissionRuleDTO | null>(null);

    /**
     * Carrega as regras e os tipos de documento em paralelo, achatando 
     * a árvore de categorias para uma lista simples de tipos.
     */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesData, categoriesData] = await Promise.all([
                emissionRuleService.getAll(),
                documentService.getTypes()
            ]);

            setRules(rulesData);

            // Achata as categorias numa lista única de DocumentTypeDTO
            const allTypes = categoriesData.flatMap((category: any) => category.types || []);
            setDocTypes(allTypes);

        } catch (error) {
            toast.error("Erro ao carregar dados dos diretórios.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * Cruza as regras com o tipo de documento para saber a qual aba elas pertencem
     * e aplica o filtro de pesquisa em tempo real.
     */
    const filteredRules = useMemo(() => {
        return rules.filter(rule => {
            // Verifica o escopo
            const doc = docTypes.find(d => d.id === rule.document_type_id);
            if (doc?.scope !== activeTab) return false;

            // Verifica o texto de pesquisa
            const term = searchTerm.toLowerCase();
            return (
                rule.document_type_name?.toLowerCase().includes(term) ||
                rule.city?.toLowerCase().includes(term) ||
                rule.state?.toLowerCase().includes(term)
            );
        });
    }, [rules, docTypes, activeTab, searchTerm]);

    /** Prepara os documentos compatíveis com a aba atual para enviar ao Modal */
    const currentScopeDocTypes = useMemo(() => {
        return docTypes.filter(doc => doc.scope === activeTab);
    }, [docTypes, activeTab]);

    /**
     * Exclui uma regra após confirmação.
     * @param {string} id - ID da regra de emissão.
     */
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta regra?")) return;
        try {
            await emissionRuleService.delete(id);
            toast.success("Regra excluída com sucesso.");
            loadData();
        } catch {
            toast.error("Erro ao excluir a regra.");
        }
    };

    /** Abre o modal em modo de criação ou edição */
    const openModal = (rule?: EmissionRuleDTO) => {
        setEditingRule(rule || null);
        setIsModalOpen(true);
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

            {/* Abas Isoladas */}
            <RulesTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Lista Isolada */}
            <RulesList
                loading={loading}
                rules={filteredRules}
                activeTab={activeTab}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onEdit={openModal}
                onDelete={handleDelete}
            />

            {/* Modal Isolado com Inteligência Própria */}
            {isModalOpen && (
                <RuleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadData}
                    activeTab={activeTab}
                    editingRule={editingRule}
                    docTypes={currentScopeDocTypes}
                />
            )}
        </div>
    );
}