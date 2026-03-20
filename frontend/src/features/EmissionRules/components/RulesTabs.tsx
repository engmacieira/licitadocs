import { Globe, Landmark, Building } from 'lucide-react';
import type { ScopeTab } from '../RulesOrchestrator';

/**
 * Propriedades do componente RulesTabs.
 * @interface RulesTabsProps
 */
interface RulesTabsProps {
    /** A aba atualmente selecionada. */
    activeTab: ScopeTab;
    /** Função para alterar a aba selecionada. */
    setActiveTab: (tab: ScopeTab) => void;
}

/**
 * Componente visual de navegação (Abas) para alternar entre as regras 
 * de emissão Nacionais, Estaduais e Municipais.
 */
export function RulesTabs({ activeTab, setActiveTab }: RulesTabsProps) {
    return (
        <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
            <button
                onClick={() => setActiveTab('NATIONAL')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'NATIONAL' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                <Globe size={18} /> Nacional
            </button>
            <button
                onClick={() => setActiveTab('STATE')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'STATE' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                <Landmark size={18} /> Estadual
            </button>
            <button
                onClick={() => setActiveTab('MUNICIPAL')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MUNICIPAL' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                <Building size={18} /> Municipal
            </button>
        </div>
    );
}