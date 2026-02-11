import { useEffect, useState, useRef } from 'react';
import { documentService } from '../../services/documentService'; // Use seu service existente
import type { DocumentDTO } from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, FileText, Download, Search, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext'; // <--- IMPORTANTE

export function DocumentsPage() {
    const { user } = useAuth(); // <--- Pegamos o usuário para ver a role
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // O input Ref só é necessário se for Admin, mas podemos manter aqui sem problemas
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar documentos.");
        } finally {
            setLoading(false);
        }
    }

    // Função de download real
    async function handleDownload(doc: DocumentDTO) {
        try {
            toast.info("Iniciando download...");
            // Assumindo que você adicionou o método download no service conforme instrução anterior
            // Se não tiver, use: window.open(doc.url) se tiver URL pública, ou implemente o blob
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch (e) {
            toast.error("Erro ao baixar.");
        }
    }

    // Função de upload (Só será chamada se for admin)
    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        // ... (seu código de upload existente pode ficar aqui se quiser manter a funcionalidade para admin nesta tela)
        // Mas lembre-se: o Admin já tem o "Upload Centralizado", então talvez nem precise de upload aqui.
        toast.info("Admins devem usar o menu 'Upload Centralizado'.");
    }

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Meus Documentos</h1>
                    <p className="text-slate-500">Acesse os arquivos da sua empresa.</p>
                </div>

                {/* BLINDAGEM VISUAL: Só mostra botão se for Admin */}
                {isAdmin && (
                    <Button onClick={() => toast.info("Use o menu 'Upload Centralizado' para enviar arquivos.")}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Documento
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /></div>
                ) : filteredDocs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <FolderOpen className="h-12 w-12 mb-3 opacity-20" />
                        <p>Nenhum documento encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Arquivo</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded text-blue-600"><FileText size={18} /></div>
                                            <span className="font-medium text-slate-900">{doc.filename}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {/* Ajuste conforme seu DTO: doc.created_at */}
                                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="text-slate-400 hover:text-blue-600 p-2"
                                                title="Baixar"
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