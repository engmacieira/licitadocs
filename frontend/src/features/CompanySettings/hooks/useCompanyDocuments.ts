import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function useCompanyDocuments(companyId: string | undefined) {
    const [clientDocs, setClientDocs] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    const loadClientDocuments = useCallback(async () => {
        if (!companyId) return;
        setIsLoadingDocs(true);
        try {
            const { data } = await api.get(`/documents/?company_id=${companyId}&is_client_upload=true`);
            setClientDocs(data);
        } catch (error) {
            console.error("Erro ao buscar documentos", error);
        } finally {
            setIsLoadingDocs(false);
        }
    }, [companyId]);

    const handleUploadDoc = async (file: File, docTitle: string) => {
        if (!companyId) return;
        const toastId = toast.loading("Enviando arquivo...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", docTitle);
            formData.append("company_id", companyId);
            formData.append("is_client_upload", "true");

            await api.post("/documents/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success(`${docTitle} enviado com sucesso!`, { id: toastId });
            loadClientDocuments();
        } catch (error) {
            toast.error("Erro no envio.", { id: toastId });
        }
    };

    const handleDownloadDoc = async (docId: string, filename: string) => {
        try {
            const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Erro ao baixar documento.");
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;
        try {
            const toastId = toast.loading("A excluir...");
            await api.delete(`/documents/${docId}`);
            toast.success("Documento excluído.", { id: toastId });
            loadClientDocuments();
        } catch (error) {
            toast.error("Erro ao excluir documento.");
        }
    };

    return {
        clientDocs,
        isLoadingDocs,
        loadClientDocuments,
        handleUploadDoc,
        handleDownloadDoc,
        handleDeleteDoc
    };
}
