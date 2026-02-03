import { useEffect, useState, useRef } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, FileText, Download, Calendar, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Delay artificial mínimo para evitar "piscar" muito rápido se a net for boa demais
            // await new Promise(resolve => setTimeout(resolve, 500)); 
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível carregar a lista de documentos.");
        } finally {
            setLoading(false);
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.warning("Formato inválido", {
                description: "Por favor, envie apenas arquivos PDF."
            });
            return;
        }

        try {
            setUploading(true);

            // UX: Feedback de progresso
            const promise = documentService.upload(file);

            toast.promise(promise, {
                loading: 'Enviando documento para a nuvem...',
                success: 'Documento salvo com sucesso!',
                error: 'Erro ao enviar. Tente novamente.'
            });

            await promise;
            await loadData(); // Recarrega a lista silenciosamente
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    // Filtragem local
    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Meus Documentos</h1>
                    <p className="text-slate-500">Gerencie e envie seus arquivos contratuais.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {/* Barra de Busca */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Botão de Upload */}
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0"
                    >
                        <Plus className="mr-2" size={18} />
                        Novo Upload
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {/* Container da Tabela */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    // Skeleton Loading da Tabela
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3 w-1/3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24 hidden md:block" />
                                <Skeleton className="h-4 w-24 hidden md:block" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : filteredDocs.length === 0 ? (
                    // Empty State
                    <div className="p-16 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <FileText size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhum documento encontrado</h3>
                        <p className="text-slate-500 max-w-sm mt-1">
                            Você ainda não enviou nenhum arquivo. Clique no botão "Novo Upload" para começar.
                        </p>
                    </div>
                ) : (
                    // Tabela Real
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Nome do Arquivo</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Enviado em</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Validade</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{doc.filename}</p>
                                                    <p className="text-xs text-slate-400 font-mono md:hidden">
                                                        {format(new Date(doc.created_at || new Date()), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                                            {doc.expiration_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {format(new Date(doc.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                                                title="Baixar Documento"
                                                onClick={() => toast.info(`Download iniciado: ${doc.filename}`)}
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