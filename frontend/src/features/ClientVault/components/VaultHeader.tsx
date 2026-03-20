import { Search } from 'lucide-react';

/**
 * Propriedades do componente VaultHeader.
 * @interface VaultHeaderProps
 */
interface VaultHeaderProps {
    /** O termo de pesquisa atual digitado pelo utilizador. */
    searchTerm: string;
    /** Função para atualizar o termo de pesquisa no orquestrador. */
    setSearchTerm: (term: string) => void;
}

/**
 * Componente visual que exibe o cabeçalho do Cofre Digital do cliente.
 * Inclui o título, a descrição e a barra de pesquisa otimizada.
 */
export function VaultHeader({ searchTerm, setSearchTerm }: VaultHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Cofre Digital</h1>
                <p className="text-sm text-slate-500">
                    Gerencie e visualize as certidões e documentos da sua empresa.
                </p>
            </div>

            <div className="w-full sm:w-72 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>
        </div>
    );
}