import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Search, UploadCloud,
    FolderOpen, AlertCircle, Download,
    FileText, Save, ShieldCheck
} from 'lucide-react';

// Serviços (Clean Architecture)
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';

// Componentes Genéricos UI
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

// Subcomponentes da Feature (Estarão na mesma pasta)
import { CompanyAutocomplete } from './components/CompanyAutocomplete';
import { CompanyVault } from './components/CompanyVault';
import { UploadModal } from './components/UploadModal';
import { EditDocumentModal } from './components/EditDocumentModal';

/**
 * Orquestrador central da Gestão de Documentos (Cofre Digital).
 * Gere a seleção de empresas, carregamento de documentos, controlo
 * dos modais de Upload/Edição e a submissão de notas de pendência.
 */
export function DocumentVaultOrchestrator() {
    // --- ESTADOS DE DADOS ---
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // --- ESTADOS DE MODAIS ---
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [documentToEdit, setDocumentToEdit] = useState<DocumentDTO | null>(null);

    // --- ESTADOS DE PENDÊNCIAS ---
    const [pendingNotes, setPendingNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    /** Carrega a lista de empresas ao inicializar o componente. */
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

    /** Monitoriza a troca de empresa para carregar documentos e notas. */
    useEffect(() => {
        if (!selectedCompanyId) {
            setDocuments([]);
            setPendingNotes("");
            return;
        }
        loadDocuments(selectedCompanyId);

        const company = companies.find(c => c.id === selectedCompanyId);
        if (company) {
            setPendingNotes(company.pending_docs_notes || "");
        }
    }, [selectedCompanyId, companies]);

    useEffect(() => {
        async function fetchCompanies() {
            setLoadingCompanies(true);
            try {
                const data = await companyService.getAll();
                setCompanies(data);
            } finally {
                setLoadingCompanies(false);
            }
        }
        fetchCompanies();
    }, []);

    /**
     * Busca os documentos da empresa selecionada na API.
     * @param {string} companyId - ID da empresa.
     */
    async function loadDocuments(companyId: string) {
        setLoadingDocs(true);
        try {
            const docs = await documentService.getAll(companyId);
            setDocuments(docs);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar documentos.");
        } finally {
            setLoadingDocs(false);
        }
    }

    /** Exclui um documento definitivamente após confirmação. */
    const handleDeleteDocument = async (doc: DocumentDTO) => {
        if (window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o documento "${doc.title || doc.filename}"? Esta ação não pode ser desfeita.`)) {
            try {
                await documentService.deleteDocument(doc.id);
                toast.success("Documento excluído com sucesso!");
                loadDocuments(selectedCompanyId);
            } catch (error) {
                toast.error("Erro ao excluir o documento.");
            }
        }
    };

    /** Move o documento para o status de 'archived'. */
    const handleArchiveDocument = async (doc: DocumentDTO) => {
        if (window.confirm(`Deseja mover "${doc.title || doc.filename}" para a área de armazenamento?`)) {
            try {
                await documentService.updateDocument(doc.id, { status: 'archived' });
                toast.success("Documento armazenado com sucesso!");
                loadDocuments(selectedCompanyId);
            } catch (error) {
                toast.error("Erro ao arquivar o documento.");
            }
        }
    };

    /** Guarda as anotações de pendência visíveis para o cliente. */
    const handleSavePendingNotes = async () => {
        if (!selectedCompanyId) return;
        setIsSavingNotes(true);
        try {
            await companyService.update(selectedCompanyId, { pending_docs_notes: pendingNotes });
            toast.success("Pendências salvas! O cliente poderá ver estes avisos.");
            setCompanies(prev => prev.map(c => c.id === selectedCompanyId ? { ...c, pending_docs_notes: pendingNotes } : c));
        } catch (error) {
            toast.error("Erro ao salvar pendências.");
        } finally {
            setIsSavingNotes(false);
        }
    };

    /** Faz o download do ficheiro original anexado. */
    const handleDownloadClientDoc = async (docId: string, filename: string) => {
        try {
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar documento.");
        }
    };

    // --- DERIVAÇÕES E FILTROS ---
    const clientUploads = documents.filter(doc => doc.is_client_upload);
    const officialVault = documents.filter(doc => !doc.is_client_upload);
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
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

            {/* Área de Seleção */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* NOVO SELETOR AVANÇADO (Substituindo o <select> nativo) [US-2902] */}
                <CompanyAutocomplete
                    companies={companies}
                    value={selectedCompanyId}
                    isLoading={loadingCompanies}
                    onChange={(id) => setSelectedCompanyId(id)}
                />

                <Button
                    disabled={!selectedCompanyId}
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-10 px-4"
                >
                    <UploadCloud className="mr-2 h-4 w-4" /> Novo Oficial
                </Button>
            </div>

            {/* Conteúdo Dinâmico */}
            {selectedCompanyId ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">

                    {/* Header da Empresa Selecionada */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-linear-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center text-blue-700 font-bold border border-blue-100 shadow-sm text-xl">
                                {(selectedCompany?.razao_social || selectedCompany?.name || "?")[0]}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg">{selectedCompany?.razao_social || selectedCompany?.name}</h2>
                                <p className="text-sm text-slate-500 font-mono mt-0.5">{selectedCompany?.cnpj}</p>
                            </div>
                        </div>

                        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Novo Documento Oficial
                        </Button>
                    </div>

                    {loadingDocs ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* COLUNA ESQUERDA: Uploads do Cliente e Pendências */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Bloco 1: Arquivos Recebidos */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            Enviados pelo Cliente
                                            <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full text-xs ml-auto">
                                                {clientUploads.length}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {clientUploads.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-4">Nenhum documento enviado ainda.</p>
                                        ) : (
                                            clientUploads.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">{doc.title || doc.filename}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadClientDoc(doc.id, doc.filename)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shrink-0 ml-2"
                                                        title="Baixar para validação"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Bloco 2: Anotações e Pendências */}
                                <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-amber-200/50 bg-amber-100/30">
                                        <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            Pendências a Corrigir
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        <textarea
                                            value={pendingNotes}
                                            onChange={(e) => setPendingNotes(e.target.value)}
                                            placeholder="Ex: O Contrato Social enviado está faltando a página 3. Por favor, reenvie."
                                            className="w-full text-sm p-3 rounded-lg border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none resize-none h-32 text-slate-700"
                                        />
                                        <Button
                                            size="sm"
                                            className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={handleSavePendingNotes}
                                            isLoading={isSavingNotes}
                                        >
                                            <Save className="h-4 w-4 mr-2" /> Salvar Avisos
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA DIREITA: O Cofre Oficial */}
                            <div className="lg:col-span-2">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-green-600" /> Cofre Oficial
                                    </h3>
                                    {officialVault.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Nenhum documento validado no cofre.</p>
                                        </div>
                                    ) : (
                                        <CompanyVault
                                            documents={officialVault}
                                            onEditClick={(doc) => {
                                                setDocumentToEdit(doc);
                                                setIsEditModalOpen(true);
                                            }}
                                            onDeleteClick={handleDeleteDocument}
                                            onArchiveClick={handleArchiveDocument}
                                        />
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <Search className="h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-600">Nenhuma empresa selecionada</h3>
                    <p className="max-w-xs mx-auto mt-2">
                        Utilize o seletor acima para carregar o cofre digital e analisar as pendências de um cliente.
                    </p>
                </div>
            )}

            {/* --- MODAIS ISOLADOS --- */}
            {selectedCompanyId && (
                <UploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={() => loadDocuments(selectedCompanyId)}
                    targetCompanyId={selectedCompanyId}
                />
            )}

            {documentToEdit && (
                <EditDocumentModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setDocumentToEdit(null);
                    }}
                    onSuccess={() => loadDocuments(selectedCompanyId)}
                    document={documentToEdit}
                />
            )}
        </div>
    );
}