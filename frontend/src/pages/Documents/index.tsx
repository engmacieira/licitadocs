import { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, Download, Trash2, Search } from 'lucide-react';

export function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Busca dados ao carregar a página
    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            setLoading(true);
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error("Erro ao buscar documentos", error);
            alert("Erro ao carregar lista de documentos.");
        } finally {
            setLoading(false);
        }
    }

    // Filtro de busca local (Front-end search)
    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header com Título e Botão de Ação */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Meus Documentos</h1>
                    <p className="text-slate-500">Gerencie seus arquivos e certidões.</p>
                </div>
                <div className="w-full sm:w-auto">
                    <Button onClick={() => alert('Feature de Upload virá na próxima tarefa!')}>
                        <Plus size={18} className="mr-2" />
                        Novo Documento
                    </Button>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar pelo nome do arquivo..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Dados */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Carregando documentos...</div>
                ) : filteredDocs.length === 0 ? (
                    // Empty State (Estado Vazio)
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhum documento encontrado</h3>
                        <p className="text-slate-500 max-w-sm mt-1">
                            Você ainda não enviou nenhum documento. Clique em "Novo Documento" para começar.
                        </p>
                    </div>
                ) : (
                    // Tabela Real
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4">Nome do Arquivo</th>
                                <th className="py-3 px-4">ID do Sistema</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        {doc.filename}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{doc.id.substring(0, 8)}...</td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Baixar">
                                                <Download size={18} />
                                            </button>
                                            <button className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
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