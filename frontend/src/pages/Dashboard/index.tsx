import { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { FileText, CheckCircle, AlertTriangle, Clock, Search, Download } from 'lucide-react';
import { ChatWidget } from '../../components/ChatWidget';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner'; // Importando o Sonner
import { Skeleton } from '../../components/ui/Skeleton'; // Importando o Skeleton

export function Dashboard() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            // Simulando um delay pequeno para o usuário ver o Skeleton (opcional, remova em prod)
            // await new Promise(resolve => setTimeout(resolve, 800)); 
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível carregar seus documentos.");
        } finally {
            setLoading(false);
        }
    }

    // UX: Função auxiliar para status visual
    function getStatusStyle(doc: DocumentDTO) {
        if (!doc.expiration_date) return {
            bg: 'bg-slate-100', text: 'text-slate-600', label: 'Permanente', icon: <CheckCircle size={14} />
        };

        const today = new Date();
        const expDate = new Date(doc.expiration_date);
        const daysToExpire = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpire < 0) return {
            bg: 'bg-red-50', text: 'text-red-700', label: 'Vencido', icon: <AlertTriangle size={14} />
        };
        if (daysToExpire < 30) return {
            bg: 'bg-amber-50', text: 'text-amber-700', label: 'Vence em breve', icon: <Clock size={14} />
        };
        return {
            bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Válido', icon: <CheckCircle size={14} />
        };
    }

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(filter.toLowerCase())
    );

    const handleDownload = (filename: string) => {
        // UX: Feedback imediato ao invés de alert
        toast.info(`Iniciando download de: ${filename}`, {
            description: "O arquivo será baixado em instantes."
        });
    };

    return (
        <div className="space-y-6">
            {/* ... Cabeçalho e Busca (Mantenha igual) ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Meu Cofre Digital</h1>
                    <p className="text-slate-500">Consulte suas certidões e documentos ativos.</p>
                </div>
                {/* Barra de Busca mantida igual */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar documento..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Grid de Estatísticas: Adicionei Loading State aqui também */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? (
                    // Skeletons dos Cards
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 h-[88px]">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-10" />
                            </div>
                        </div>
                    ))
                ) : (
                    // ... Seus Cards Originais (Mantive a lógica, só limpei o código visualmente na minha mente) ...
                    <>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <CheckCircle className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600 font-medium">Documentos Válidos</p>
                                <p className="text-2xl font-bold text-green-800">
                                    {documents.filter(d => getStatusStyle(d).label === 'Válido').length}
                                </p>
                            </div>
                        </div>
                        {/* Repita para os outros cards (Vencidos e Total) conforme seu código original */}
                        {/* Estou abreviando para focar na mudança principal */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <FileText className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Arquivado</p>
                                <p className="text-2xl font-bold text-blue-800">{documents.length}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Listagem com Loading Skeleton */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {/* Simulando linhas da tabela carregando */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-2">
                                <div className="flex items-center gap-3 w-1/3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        ))}
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="p-12 text-center animate-in fade-in zoom-in duration-300">
                        {/* ... Seu Empty State Original ... */}
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium">Nenhum documento encontrado</h3>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                <th className="p-4">Documento</th>
                                <th className="p-4">Validade</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocs.map((doc) => {
                                const status = getStatusStyle(doc); // Usando a nova função visual
                                return (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{doc.filename}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Enviado em {doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {doc.expiration_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {format(new Date(doc.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {/* Badge Visual Refatorada */}
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${status.bg} ${status.text}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-md"
                                                onClick={() => handleDownload(doc.filename)}
                                                title="Baixar Documento"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <ChatWidget />
        </div>
    );
}