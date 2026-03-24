import { Search, Download, Loader2 } from 'lucide-react';

/**
 * Propriedades do componente VaultHeader.
 * @interface VaultHeaderProps
 */
interface VaultHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    /** Função acionada ao clicar em Baixar Tudo. */
    onDownloadZip?: () => void;
    /** Indica se o download do ZIP está em andamento. */
    isDownloading?: boolean;
}

/**
 * Componente visual que exibe o cabeçalho do Cofre Digital do cliente.
 * Inclui o título, a descrição e a barra de pesquisa otimizada.
 */
export function VaultHeader({ searchTerm, setSearchTerm, onDownloadZip, isDownloading }: VaultHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Cofre Digital</h1>
                <p className="text-sm text-slate-500">
                    Gerencie e visualize as certidões e documentos da sua empresa.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Barra de Pesquisa */}
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

                {/* Botão de Download em Lote */}
                {onDownloadZip && (
                    <button
                        onClick={onDownloadZip}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        <span className="whitespace-nowrap">
                            {isDownloading ? 'Gerando ZIP...' : 'Baixar Tudo'}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}