import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, FileSearch, ShieldCheck } from 'lucide-react';

// Serviços e Contexto
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';
import { useAuth } from '../../../contexts/AuthContext';

// Componentes UI
import { Skeleton } from '../../../components/ui/Skeleton';
import { CompanyVault } from '../../../components/CompanyVault';

export function DocumentsPage() {
    const { user, currentCompany } = useAuth();
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin';

    // Carregamento de Dados
    const loadData = useCallback(async () => {
        // Se for cliente e não tiver empresa carregada, aguarda
        if (!isAdmin && !currentCompany?.id) return;

        setLoading(true);
        try {
            const companyId = isAdmin ? undefined : currentCompany?.id;
            const data = await documentService.getAll(companyId);
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível carregar os documentos.");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, currentCompany?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 🚀 MELHORIA SPRINT 17: Filtro Turbinado (Busca também por categoria, tipo e código)
    const filteredDocs = documents.filter(doc => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();

        return (
            doc.filename?.toLowerCase().includes(term) ||
            doc.title?.toLowerCase().includes(term) ||
            doc.category_name?.toLowerCase().includes(term) ||
            doc.type_name?.toLowerCase().includes(term) ||
            doc.authentication_code?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header e Barra de Busca */}
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

            {/* Conteúdo Principal */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                ) : filteredDocs.length === 0 ? (
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
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                        {/* Renderização do Cofre */}
                        <CompanyVault documents={filteredDocs} />

                        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                            <ShieldCheck size={14} />
                            <p>
                                Documentos vencidos são movidos automaticamente para o histórico dentro de cada categoria.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}