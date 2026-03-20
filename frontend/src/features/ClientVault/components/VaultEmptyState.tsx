import { FileSearch } from 'lucide-react';

/**
 * Propriedades do componente VaultEmptyState.
 * @interface VaultEmptyStateProps
 */
interface VaultEmptyStateProps {
    /** O termo de pesquisa atual (para dar feedback contextualizado). */
    searchTerm: string;
    /** Função acionada ao clicar em "Limpar busca". */
    onClearSearch: () => void;
}

/**
 * Componente visual de "Empty State" (Estado Vazio).
 * Exibe uma mensagem amigável caso o cliente não tenha documentos no cofre
 * ou caso a sua pesquisa textual não encontre resultados.
 */
export function VaultEmptyState({ searchTerm, onClearSearch }: VaultEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                <FileSearch className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Nenhum documento encontrado</h3>
            <p className="text-slate-500 mt-2 max-w-md text-center">
                {searchTerm
                    ? `Não encontramos resultados para "${searchTerm}" nas categorias.`
                    : "Ainda não há certidões emitidas para sua empresa. Assim que nosso sistema processar, elas aparecerão aqui automaticamente."}
            </p>
            {searchTerm && (
                <button
                    onClick={onClearSearch}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                    Limpar busca
                </button>
            )}
        </div>
    );
}