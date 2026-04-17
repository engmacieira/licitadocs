import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, Search, AlertTriangle, Clock } from 'lucide-react';

import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../types';

// Subcomponentes da Feature
import { IrregularMonitor } from './components/IrregularMonitor';
import { ExpiringMonitor } from './components/ExpiringMonitor';

/**
 * Orquestrador do Monitor Global de Regularidade.
 * Gere a busca paralela de documentos irregulares e a vencer, 
 * controla o estado das abas (tabs) de navegação e os filtros 
 * (texto de pesquisa e intervalo de dias).
 */
export function MonitorOrchestrator() {
    // --- ESTADOS DE DADOS ---
    const [expiringDocs, setExpiringDocs] = useState<DocumentDTO[]>([]);
    const [irregularDocs, setIrregularDocs] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE FILTROS E UI ---
    const [activeTab, setActiveTab] = useState<'expiring' | 'irregular'>('irregular');
    const [daysFilter, setDaysFilter] = useState<number>(30);
    const [searchTerm, setSearchTerm] = useState('');

    /** * Recarrega os dados do monitor sempre que o filtro de dias for alterado.
     */
    useEffect(() => {
        loadMonitors();
    }, [daysFilter]);

    /**
     * Busca as listas de documentos a vencer e irregulares em paralelo 
     * para otimizar a velocidade de carregamento da interface.
     */
    async function loadMonitors() {
        setLoading(true);
        try {
            const [expiring, irregular] = await Promise.all([
                documentService.getExpiring(daysFilter),
                documentService.getIrregular()
            ]);
            setExpiringDocs(expiring);
            setIrregularDocs(irregular);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar o monitor de regularidade.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * Interage com o serviço para baixar um documento diretamente do monitor.
     * @param {string} docId - Identificador único do documento.
     * @param {string} filename - Nome do ficheiro para salvar.
     */
    const handleDownload = async (docId: string, filename: string) => {
        try {
            toast.info("A iniciar download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in">
            {/* Header Moderno com Filtros Globais */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-100 text-slate-700 rounded-2xl">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Monitor de Regularidade</h1>
                        <p className="text-sm text-slate-500">Controlo global de pendências e certidões a vencer.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou doc..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                        />
                    </div>
                    {activeTab === 'expiring' && (
                        <select
                            value={daysFilter}
                            onChange={(e) => setDaysFilter(Number(e.target.value))}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            <option value={15}>Vence em 15 dias</option>
                            <option value={30}>Vence em 30 dias</option>
                            <option value={60}>Vence em 60 dias</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Abas (Tabs) de Navegação */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-2">
                <button
                    onClick={() => setActiveTab('irregular')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'irregular' ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
                >
                    <AlertTriangle size={18} />
                    Empresas com Pendências
                    <span className="ml-2 bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs">{irregularDocs.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('expiring')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'expiring' ? 'border-blue-500 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
                >
                    <Clock size={18} />
                    Documentos a Vencer
                    <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{expiringDocs.length}</span>
                </button>
            </div>

            {/* Área de Renderização Condicional */}
            {loading ? (
                <div className="p-10 text-center text-slate-500">A atualizar monitor...</div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'irregular' && (
                        <IrregularMonitor
                            documents={irregularDocs}
                            searchTerm={searchTerm}
                        />
                    )}

                    {activeTab === 'expiring' && (
                        <ExpiringMonitor
                            documents={expiringDocs}
                            searchTerm={searchTerm}
                            daysFilter={daysFilter}
                            onDownload={handleDownload}
                        />
                    )}
                </div>
            )}
        </div>
    );
}