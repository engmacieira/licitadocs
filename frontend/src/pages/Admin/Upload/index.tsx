import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Building2, Search, UploadCloud,
    Filter, FolderOpen
} from 'lucide-react';

// Serviços
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';

// Componentes
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CompanyVault } from '../../../components/CompanyVault'; // Reutilizando nosso componente
import { UploadModal } from '../../../components/UploadModal';

export function AdminUploadPage() {
    // Estados
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Carrega lista de empresas ao abrir a tela
    useEffect(() => {
        async function loadCompanies() {
            try {
                const data = await companyService.getAll();
                setCompanies(data);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar lista de empresas.");
            }
        }
        loadCompanies();
    }, []);

    // Monitora mudança na seleção da empresa para buscar os documentos
    useEffect(() => {
        if (!selectedCompanyId) {
            setDocuments([]);
            return;
        }
        loadDocuments(selectedCompanyId);
    }, [selectedCompanyId]);

    async function loadDocuments(companyId: string) {
        setLoadingDocs(true);
        try {
            // Usa o service que já criamos para buscar docs de uma empresa específica
            const docs = await documentService.getAll(companyId);
            setDocuments(docs);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar documentos.");
        } finally {
            setLoadingDocs(false);
        }
    }

    // Helper para pegar dados da empresa selecionada (para exibir no header)
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                        Central de Documentos
                    </h1>
                    <p className="text-sm text-slate-500">
                        Selecione um cliente para gerenciar o cofre digital.
                    </p>
                </div>
            </div>

            {/* Área de Seleção (Busca) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Selecione a Empresa
                </label>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">Selecione um cliente...</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.razao_social || company.name} ({company.cnpj})
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Botão decorativo ou de filtro futuro */}
                    <Button variant="outline" disabled>
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Conteúdo Dinâmico */}
            {selectedCompanyId ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">

                    {/* Header da Empresa Selecionada */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center text-blue-700 font-bold border border-blue-100 shadow-sm">
                                {(selectedCompany?.razao_social || selectedCompany?.name || "?")[0]}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">{selectedCompany?.razao_social || selectedCompany?.name}</h2>
                                <p className="text-xs text-slate-500 font-mono">{selectedCompany?.cnpj}</p>
                            </div>
                        </div>

                        <Button onClick={() => setIsUploadModalOpen(true)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Novo Documento
                        </Button>
                    </div>

                    {/* O COFRE DIGITAL */}
                    {loadingDocs ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (
                        <CompanyVault documents={documents} />
                    )}
                </div>
            ) : (
                // Empty State (Nenhuma empresa selecionada)
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <Search className="h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-600">Nenhuma empresa selecionada</h3>
                    <p className="max-w-xs mx-auto mt-2">
                        Utilize o seletor acima para carregar o cofre digital de um cliente.
                    </p>
                </div>
            )}

            {/* Modal de Upload */}
            {selectedCompanyId && (
                <UploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={() => loadDocuments(selectedCompanyId)}
                    targetCompanyId={selectedCompanyId}
                />
            )}
        </div>
    );
}