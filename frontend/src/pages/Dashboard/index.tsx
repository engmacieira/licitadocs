import { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { FileText, CheckCircle, AlertTriangle, Clock, Search } from 'lucide-react';
import { ChatWidget } from '../../components/ChatWidget'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error("Erro ao carregar documentos", error);
        } finally {
            setLoading(false);
        }
    }

    // Função auxiliar para definir status visual
    function getStatusColor(doc: DocumentDTO) {
        if (!doc.expiration_date) return 'bg-gray-100 text-gray-600'; // Sem validade

        const today = new Date();
        const expDate = new Date(doc.expiration_date);
        const daysToExpire = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpire < 0) return 'bg-red-100 text-red-700'; // Vencido
        if (daysToExpire < 30) return 'bg-yellow-100 text-yellow-700'; // Vence em breve
        return 'bg-green-100 text-green-700'; // Válido
    }

    function getStatusLabel(doc: DocumentDTO) {
        if (!doc.expiration_date) return 'Permanente';
        const today = new Date();
        const expDate = new Date(doc.expiration_date);

        if (expDate < today) return 'Vencido';
        return 'Válido';
    }

    // Filtragem simples no frontend
    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Meu Cofre Digital</h1>
                    <p className="text-slate-500">
                        Consulte suas certidões e documentos ativos.
                    </p>
                </div>

                {/* Barra de Busca */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar documento..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Grid de Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-green-600 font-medium">Documentos Válidos</p>
                        <p className="text-2xl font-bold text-green-800">
                            {documents.filter(d => getStatusLabel(d) === 'Válido').length}
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                        <AlertTriangle className="text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-red-600 font-medium">Vencidos / Ação Necessária</p>
                        <p className="text-2xl font-bold text-red-800">
                            {documents.filter(d => getStatusLabel(d) === 'Vencido').length}
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Total Arquivado</p>
                        <p className="text-2xl font-bold text-blue-800">{documents.length}</p>
                    </div>
                </div>
            </div>

            {/* Listagem (Read-Only) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando seu cofre...</div>
                ) : filteredDocs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium">Nenhum documento encontrado</h3>
                        <p className="text-gray-500 text-sm mt-1">Sua pasta está vazia ou a busca não retornou resultados.</p>
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
                            {filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
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
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc)}`}>
                                            {getStatusLabel(doc)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                            onClick={() => alert(`Em breve: Download do arquivo ${doc.filename}`)}
                                        >
                                            Baixar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Widget de Chat Flutuante */}
            <ChatWidget />
        </div>
    );
}