import { Search } from 'lucide-react';

/**
 * Propriedades do componente FilterBar.
 * @interface FilterBarProps
 */
interface FilterBarProps {
    /** Termo de pesquisa atual. */
    searchTerm: string;
    /** Função para atualizar o termo de pesquisa. */
    setSearchTerm: (term: string) => void;
    /** Filtro de status atual (Todas, Com Pendências, Regulares). */
    filter: 'all' | 'pending' | 'regular';
    /** Função para atualizar o filtro de status. */
    setFilter: (filter: 'all' | 'pending' | 'regular') => void;
}

/**
 * Componente visual que renderiza a barra de pesquisa por texto (Razão Social ou CNPJ)
 * e os botões de filtro rápido por status de onboarding.
 */
export function FilterBar({ searchTerm, setSearchTerm, filter, setFilter }: FilterBarProps) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por Razão Social ou CNPJ..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todas" />
                <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Com Pendências" />
                <FilterButton active={filter === 'regular'} onClick={() => setFilter('regular')} label="Regulares" />
            </div>
        </div>
    );
}

/**
 * Subcomponente auxiliar interno para renderizar os botões de filtro com o estilo correto 
 * (ativo vs inativo).
 */
function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
        >
            {label}
        </button>
    );
}