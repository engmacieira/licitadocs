import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { ClientStats } from '../../services/dashboardService';
import { StatsCard } from '../../components/ui/StatsCard';
import { FileText, Building2, CheckCircle, XCircle, Download } from 'lucide-react'; // Removido Clock não usado
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../contexts/AuthContext'; // [NOVO] Importar Contexto

export function Dashboard() {
    const { currentCompany } = useAuth(); // [NOVO] Pegar a empresa atual
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(true);

    // [NOVO] Envolvido em useCallback para ser usado no useEffect com dependência correta
    const loadStats = useCallback(async () => {
        // Se não tiver empresa selecionada (ainda carregando contexto), espera
        if (!currentCompany?.id) return;

        setLoading(true);
        try {
            // Passamos o ID da empresa selecionada para o serviço
            const data = await dashboardService.getClientStats(currentCompany.id);
            setStats(data);
        } catch (error) {
            console.error("Erro ao carregar dashboard", error);
            toast.error("Não foi possível carregar os dados desta empresa.");
        } finally {
            setLoading(false);
        }
    }, [currentCompany?.id]); // Recria a função se o ID mudar

    // [ATUALIZADO] Reage à mudança de currentCompany
    useEffect(() => {
        loadStats();
    }, [loadStats]);

    async function handleDownload(docId: string, filename: string) {
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        }
    }

    // Renderização de Carregamento (Skeleton)
    if (loading || !stats) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-slate-200 rounded"></div>
                    <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <div className="h-64 bg-slate-200 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header com Contexto da Empresa */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Empresa: <span className="font-medium text-slate-700">{stats.company_name}</span>
                    </p>
                </div>

                {/* Botão de Ação Rápida (Ex: Novo Upload) */}
                {/* Pode ser adicionado futuramente */}
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total de Documentos"
                    value={stats.total_docs}
                    icon={FileText}
                    description="Arquivos na nuvem"
                    color="blue"
                />
                <StatsCard
                    title="Válidos"
                    value={stats.docs_valid}
                    icon={CheckCircle}
                    description="Certidões em dia"
                    color="green"
                />
                <StatsCard
                    title="Vencidos / Inválidos"
                    value={stats.docs_expired}
                    icon={XCircle}
                    description="Requer atenção imediata"
                    color="red"
                />
                <StatsCard
                    title="Status Geral"
                    value={stats.docs_expired === 0 ? "100%" : `${Math.round((stats.docs_valid / (stats.total_docs || 1)) * 100)}%`}
                    icon={Building2}
                    description="Índice de conformidade"
                    color="blue"
                />
            </div>

            {/* Seção de Documentos Recentes */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Documentos Recentes</h2>
                </div>

                <div className="space-y-4">
                    {stats.recent_docs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhum documento encontrado.</p>
                            <p className="text-sm text-slate-400">Faça o upload do seu primeiro arquivo.</p>
                        </div>
                    ) : (
                        stats.recent_docs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${doc.status === 'valid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{doc.title || doc.filename}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{doc.created_at && format(new Date(doc.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                                            <span>•</span>
                                            <span className="uppercase">{doc.filename.split('.').pop()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Badge de Status */}
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.status === 'valid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {doc.status === 'valid' ? 'Válido' : 'Vencido'}
                                    </span>

                                    <button
                                        onClick={() => handleDownload(doc.id, doc.filename)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Baixar Agora"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Link para ver todos */}
                {stats.recent_docs.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <a href="/documents" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                            Ver todos os documentos da {stats.company_name} &rarr;
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}