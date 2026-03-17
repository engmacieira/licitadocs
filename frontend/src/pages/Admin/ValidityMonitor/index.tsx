import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    AlertTriangle, ShieldAlert, Building2, Calendar,
    FileText, Download, Clock, Search
} from 'lucide-react';

import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';
import { Skeleton } from '../../../components/ui/Skeleton';

export function ValidityMonitorPage() {
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [daysFilter, setDaysFilter] = useState<number>(30);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadExpiringDocuments();
    }, [daysFilter]);

    async function loadExpiringDocuments() {
        setLoading(true);
        try {
            const data = await documentService.getExpiring(daysFilter);
            setDocuments(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar o monitor de validade.");
        } finally {
            setLoading(false);
        }
    }

    const handleDownload = async (docId: string, filename: string) => {
        try {
            toast.info("A iniciar download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao transferir o documento.");
        }
    };

    // Função auxiliar para calcular os dias e definir as cores do alerta
    const getStatusInfo = (dateString?: string) => {
        if (!dateString) return { text: 'Sem data', color: 'bg-slate-100 text-slate-500', icon: <Clock size={14} /> };

        const expDate = new Date(dateString);
        const today = new Date();
        const diff = differenceInDays(expDate, today);

        if (diff < 0) {
            return {
                text: `Vencido há ${Math.abs(diff)} dias`,
                color: 'bg-red-50 text-red-700 border-red-200',
                icon: <ShieldAlert size={14} className="text-red-500" />
            };
        }
        if (diff === 0) {
            return {
                text: 'Vence HOJE',
                color: 'bg-orange-50 text-orange-700 border-orange-300',
                icon: <AlertTriangle size={14} className="text-orange-500" />
            };
        }
        return {
            text: `Vence em ${diff} dias`,
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: <Clock size={14} className="text-amber-500" />
        };
    };

    const filteredDocs = documents.filter(doc => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            doc.company_name?.toLowerCase().includes(term) ||
            doc.title?.toLowerCase().includes(term) ||
            doc.filename?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Monitor de Validade
                    </h1>
                    <p className="text-sm text-slate-500">
                        Acompanhe as certidões e documentos que estão prestes a caducar.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou doc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={daysFilter}
                        onChange={(e) => setDaysFilter(Number(e.target.value))}
                    >
                        <option value={15}>Próximos 15 dias</option>
                        <option value={30}>Próximos 30 dias</option>
                        <option value={60}>Próximos 60 dias</option>
                        <option value={90}>Próximos 90 dias</option>
                    </select>
                </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">
                        Documentos em Alerta <span className="ml-2 bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-xs">{filteredDocs.length}</span>
                    </h3>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
                                <ShieldAlert className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-800">Tudo sob controlo!</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                                Não há documentos ou certidões a vencer no período de {daysFilter} dias.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredDocs.map((doc) => {
                                const status = getStatusInfo(doc.expiration_date);
                                return (
                                    <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group">

                                        <div className="flex gap-4 items-start">
                                            <div className={`p-2.5 rounded-xl shrink-0 border ${status.color.split(' ')[0]} ${status.color.split(' ')[2]}`}>
                                                {status.icon}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-800 text-sm">{doc.title || 'Documento'}</h4>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                        <Building2 size={13} className="text-slate-400" />
                                                        {doc.company_name}
                                                        {doc.company_cnpj && (
                                                            <span className="text-slate-400 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded cursor-copy hover:bg-slate-200 transition-colors" title="Clique para copiar" onClick={(e) => {
                                                                e.preventDefault();
                                                                navigator.clipboard.writeText(doc.company_cnpj!);
                                                                toast.success("CNPJ copiado!");
                                                            }}>
                                                                {doc.company_cnpj}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <FileText size={13} className="text-slate-400" />
                                                        {doc.filename}
                                                    </span>
                                                    {doc.expiration_date && (
                                                        <span className="flex items-center gap-1.5 font-medium">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            Vence: {format(new Date(doc.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pl-12 sm:pl-0">
                                            <button
                                                onClick={() => handleDownload(doc.id, doc.filename)}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all"
                                            >
                                                <Download size={14} /> Transferir
                                            </button>
                                        </div>

                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}