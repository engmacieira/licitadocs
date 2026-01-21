import { useEffect, useState, useRef } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, Loader2 } from 'lucide-react';

export function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Referência para o input de arquivo (invisível)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carrega dados ao montar a tela
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error("❌ Falha ao buscar documentos:", error);
            // Não vamos usar alert aqui para não travar a tela
        } finally {
            setLoading(false);
        }
    }

    // Ação de Upload
    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Apenas PDFs são permitidos.');
            return;
        }

        try {
            setUploading(true);
            await documentService.upload(file);
            alert('Sucesso! Arquivo enviado.');
            loadData(); // Recarrega a lista
        } catch (error) {
            console.error("❌ Erro no upload:", error);
            alert('Erro ao enviar arquivo.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Meus Documentos</h1>

                {/* Botão de Upload */}
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" size={18} />}
                    Novo Documento
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Carregando...</div>
                ) : documents.length === 0 ? (
                    // Estado Vazio (Importante aparecer isso se a lista vier vazia)
                    <div className="p-12 text-center flex flex-col items-center">
                        <FileText size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhum documento encontrado</h3>
                        <p className="text-slate-500">A conexão funcionou, mas você ainda não tem arquivos.</p>
                    </div>
                ) : (
                    // Tabela
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3 text-right">ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => (
                                <tr key={doc.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        {doc.filename}
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono">
                                        {doc.id.substring(0, 8)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}