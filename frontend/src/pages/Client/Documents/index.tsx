import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Search, FileSearch, ShieldCheck
} from 'lucide-react';

// Serviços e Contexto
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';
import { useAuth } from '../../../contexts/AuthContext';

// Componentes UI
import { Skeleton } from '../../../components/ui/Skeleton';
import { CompanyVault } from '../../../components/CompanyVault'; // O novo componente de Cofre

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

    // Filtragem Local
    // A busca filtra a lista bruta e o Cofre se encarrega de categorizar o resultado
    const filteredDocs = documents.filter(doc => {
        const term = searchTerm.toLowerCase();
        return (doc.title || doc.filename).toLowerCase().includes(term);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Cofre Digital
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Documentação oficial de: <span className="font-semibold text-slate-700">{currentCompany?.razao_social}</span>
                    </p>
                </div>
            </div>

            {/* Barra de Ferramentas (Busca) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar documentos (ex: Contrato Social, CNPJ...)"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* O COFRE DIGITAL */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                            <FileSearch className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhum documento encontrado</h3>
                        <p className="text-slate-500 mt-2 max-w-md">
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
                        {/* Reutilizamos a lógica de categorias criada para o Admin */}
                        <CompanyVault documents={filteredDocs} />

                        <div className="mt-8 text-center">
                            <p className="text-xs text-slate-400">
                                Documentos vencidos são movidos automaticamente para o histórico dentro de cada categoria.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}