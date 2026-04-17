import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import type { DocumentDTO, Company } from '../../../types';

export function useDocumentVault() {
    // --- ESTADOS DE DADOS ---
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // --- ESTADOS DE PENDÊNCIAS ---
    const [pendingNotes, setPendingNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    /** Carrega a lista de empresas ao inicializar. */
    const loadCompanies = useCallback(async () => {
        setLoadingCompanies(true);
        try {
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar lista de empresas.");
        } finally {
            setLoadingCompanies(false);
        }
    }, []);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    /** Busca os documentos da empresa selecionada. */
    const loadDocuments = useCallback(async (companyId: string) => {
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
    }, []);

    /** Monitoriza a troca de empresa. */
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
    }, [selectedCompanyId, companies, loadDocuments]);

    /** Exclui um documento. */
    const handleDeleteDocument = async (doc: DocumentDTO) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o documento "${doc.title || doc.filename}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await documentService.deleteDocument(doc.id);
            toast.success("Documento excluído com sucesso!");
            loadDocuments(selectedCompanyId);
        } catch (error) {
            toast.error("Erro ao excluir o documento.");
        }
    };

    /** Arquiva um documento. */
    const handleArchiveDocument = async (doc: DocumentDTO) => {
        if (!window.confirm(`Deseja mover "${doc.title || doc.filename}" para a área de armazenamento?`)) return;
        try {
            await documentService.updateDocument(doc.id, { status: 'archived' });
            toast.success("Documento armazenado com sucesso!");
            loadDocuments(selectedCompanyId);
        } catch (error) {
            toast.error("Erro ao arquivar o documento.");
        }
    };

    /** Guarda as anotações de pendência. */
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

    /** Faz o download do ficheiro. */
    const handleDownloadClientDoc = async (docId: string, filename: string) => {
        try {
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar documento.");
        }
    };

    // --- DERIVAÇÕES ---
    const clientUploads = useMemo(() => documents.filter(doc => doc.is_client_upload), [documents]);
    const officialVault = useMemo(() => documents.filter(doc => !doc.is_client_upload), [documents]);
    const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);

    return {
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
        loadingCompanies,
        documents,
        loadingDocs,
        pendingNotes,
        setPendingNotes,
        isSavingNotes,
        handleDeleteDocument,
        handleArchiveDocument,
        handleSavePendingNotes,
        handleDownloadClientDoc,
        clientUploads,
        officialVault,
        selectedCompany,
        loadDocuments
    };
}
