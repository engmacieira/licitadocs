import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

// Serviços e Contexto
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { useAuth } from '../../contexts/AuthContext';

// Componentes UI e Partilhados
import { Skeleton } from '../../components/ui/Skeleton';
import { CompanyVault } from '../DocumentVault/components/CompanyVault'; // Reutilização inteligente!

// Subcomponentes da Feature
import { VaultHeader } from './components/VaultHeader';
import { VaultEmptyState } from './components/VaultEmptyState';

/**
 * Orquestrador do Cofre Digital (Visão do Cliente).
 * Gere o carregamento de documentos oficiais validados pela plataforma,
 * aplica filtros avançados de pesquisa em tempo real e isola a interface gráfica.
 */
export function ClientVaultOrchestrator() {
    const { user, currentCompany } = useAuth();

    // --- ESTADOS ---
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin';

    /**
     * Carrega a lista de documentos associados à empresa do cliente.
     */
    const loadData = useCallback(async () => {
        // Se for cliente e não tiver empresa carregada no contexto, aguarda.
        if (!isAdmin && !currentCompany?.id) return;

        setLoading(true);
        try {
            const companyId = isAdmin ? undefined : currentCompany?.id;
            const data = await documentService.getAll(companyId);
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível carregar os documentos do cofre.");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, currentCompany?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * MÁGICA: Filtro Turbinado.
     * Esconde documentos que foram enviados pelo próprio cliente (is_client_upload)
     * e aplica a pesquisa textual por múltiplos campos.
     */
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            // Oculta do Cofre Oficial os documentos pendentes de validação
            if (doc.is_client_upload) return false;

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
    }, [documents, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Cabeçalho e Pesquisa Isolados */}
            <VaultHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            {/* Conteúdo Principal do Cofre */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <VaultEmptyState
                        searchTerm={searchTerm}
                        onClearSearch={() => setSearchTerm('')}
                    />
                ) : (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                        {/* Renderização do Cofre (Componente Reaproveitado) */}
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