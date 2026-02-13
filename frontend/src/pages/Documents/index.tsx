import { useEffect, useState, useRef, useCallback } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { Button } from '../../components/ui/Button'; // Seu componente original
import { Skeleton } from '../../components/ui/Skeleton'; // Seu componente original
import { Plus, FileText, Download, Search, FolderOpen, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DocumentsPage() {
    const { user, currentCompany } = useAuth();
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Input de arquivo oculto
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.role === 'admin';

    // Função de carregamento memorizada para usar no useEffect
    const loadData = useCallback(async () => {
        // Se for cliente e ainda não carregou a empresa, aguarda
        if (!isAdmin && !currentCompany?.id) return;

        setLoading(true);
        try {
            // Se for Admin, busca tudo (ou filtered). Se for Cliente, busca da empresa atual.
            const companyId = isAdmin ? undefined : currentCompany?.id;
            const data = await documentService.getAll(companyId);
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar documentos.");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, currentCompany?.id]);

    // Recarrega sempre que a empresa mudar (Menu Lateral)
    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- LÓGICA DE DOWNLOAD ---
    async function handleDownload(doc: DocumentDTO) {
        try {
            toast.info("Iniciando download...");
            // Usa o ID e o filename (ou title se tiver) para baixar
            const name = doc.filename || "documento.pdf";
            await documentService.downloadDocument(doc.id, name);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao baixar o arquivo.");
        }
    }

    // --- LÓGICA DE UPLOAD ---
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validações básicas
        if (file.size > 10 * 1024 * 1024) { // 10MB
            toast.error("Arquivo muito grande. Máximo 10MB.");
            return;
        }

        if (!isAdmin && !currentCompany?.id) {
            toast.error("Nenhuma empresa selecionada.");
            return;
        }

        try {
            setIsUploading(true);
            toast.info("Enviando documento...");

            // Define o contexto do upload
            const targetCompanyId = isAdmin ? (prompt("ID da Empresa (Admin):") || "") : currentCompany!.id;

            if (!targetCompanyId) {
                toast.warning("Upload cancelado: Empresa não definida.");
                return;
            }

            // Usa o nome do arquivo como título por padrão ou pede input (simplificado para não quebrar layout)
            const title = file.name;

            await documentService.upload(file, title, targetCompanyId);

            toast.success("Upload concluído!");
            loadData(); // Atualiza a lista
        } catch (error) {
            console.error(error);
            toast.error("Falha no envio do documento.");
        } finally {
            setIsUploading(false);
            // Limpa o input para permitir selecionar o mesmo arquivo novamente se falhar
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Filtragem local
    const filteredDocs = documents.filter(doc =>
        (doc.title || doc.filename).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isAdmin ? "Gestão de Documentos (Global)" : "Meus Documentos"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isAdmin
                            ? "Visualize todos os arquivos do sistema"
                            : `Gerenciando arquivos de: ${currentCompany?.razao_social || 'Carregando...'}`
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botão de Upload agora funciona para Cliente e Admin */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                    />
                    <Button onClick={handleUploadClick} disabled={isUploading || (!isAdmin && !currentCompany)}>
                        {isUploading ? (
                            <>Enviando...</>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                {isAdmin ? "Upload Admin" : "Novo Documento"}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Barra de Busca (Mantida) */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="w-full pl-10 pr-4 py-2 border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <FolderOpen className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhum documento encontrado</h3>
                        <p className="text-slate-500">
                            {isAdmin ? "O sistema ainda não possui arquivos." : "Faça o upload do seu primeiro documento."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Arquivo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data de Envio</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded text-blue-600">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                {/* Exibe Título se tiver, senão Filename */}
                                                <span className="font-medium text-slate-900 block">
                                                    {doc.title || doc.filename}
                                                </span>
                                                {doc.title && doc.title !== doc.filename && (
                                                    <span className="text-xs text-slate-400">{doc.filename}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {doc.created_at ? format(new Date(doc.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all"
                                                title="Baixar Documento"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}