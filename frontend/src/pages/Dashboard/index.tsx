import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { ClientStats } from '../../services/dashboardService';
import { StatsCard } from '../../components/ui/StatsCard';
import { FileText, Building2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { documentService } from '../../services/documentService'; // Para o download

export function Dashboard() {
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await dashboardService.getClientStats();
                setStats(data);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
                toast.error("Não foi possível carregar seus dados.");
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    // Função de Download Rápido na Home
    async function handleDownload(docId: string, filename: string) {
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar arquivo.");
        }
    }

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[130px] rounded-xl" />
                    <Skeleton className="h-[130px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="p-8 space-y-8">
            {/* Cabeçalho de Boas Vindas */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Meu Painel</h1>
                <p className="text-slate-500">
                    Visão geral de <strong>{stats.company_name}</strong> ({stats.cnpj})
                </p>
            </div>

            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Status da Assinatura */}
                <StatsCard
                    title="Status da Conta"
                    value={stats.is_active ? "Ativa" : "Bloqueada"}
                    icon={stats.is_active ? CheckCircle : XCircle}
                    trend={stats.is_active ? "up" : "down"}
                    description={stats.is_active ? "Acesso total liberado" : "Contate o suporte"}
                    color={stats.is_active ? "green" : "red"}
                />

                {/* 2. Total de Documentos */}
                <StatsCard
                    title="Meus Documentos"
                    value={stats.total_documents.toString()}
                    icon={FileText}
                    trend="neutral"
                    description="Arquivos disponíveis"
                    color="blue"
                />
            </div>

            {/* Lista de Recentes */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" /> Chegaram Recentemente
                </h3>

                <div className="space-y-1">
                    {stats.recent_documents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p>Nenhum documento recebido ainda.</p>
                        </div>
                    ) : (
                        stats.recent_documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{doc.filename}</p>
                                        <p className="text-xs text-slate-500">
                                            {doc.created_at && format(new Date(doc.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDownload(doc.id, doc.filename)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Baixar Agora"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {stats.recent_documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                        <a href="/documents" className="text-sm text-blue-600 hover:underline font-medium">
                            Ver todos os documentos &rarr;
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}