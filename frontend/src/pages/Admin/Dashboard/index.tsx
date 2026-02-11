import { useEffect, useState } from 'react';
import { dashboardService } from '../../../services/dashboardService';
import type { AdminStats } from '../../../services/dashboardService'; // CORREÇÃO 1: 'import type'
import { StatsCard } from '../../../components/ui/StatsCard';
import { Users, FileText, Building2, TrendingUp, Clock } from 'lucide-react'; // CORREÇÃO 4: Removi AlertCircle
import { Skeleton } from '../../../components/ui/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await dashboardService.getAdminStats();
                setStats(data);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Skeleton Cards */}
                    <Skeleton className="h-[130px] rounded-xl" />
                    <Skeleton className="h-[130px] rounded-xl" />
                    <Skeleton className="h-[130px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-red-500">Erro ao carregar dados.</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                <p className="text-slate-500">Bem-vindo de volta, Administrador.</p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Empresas Ativas"
                    value={stats.total_companies.toString()}
                    icon={Building2}
                    trend="up" // CORREÇÃO 2: Apenas 'up', 'down' ou 'neutral'
                    description="+12% este mês" // O texto vai aqui
                    color="blue"
                />
                <StatsCard
                    title="Documentos Armazenados"
                    value={stats.total_documents.toString()}
                    icon={FileText}
                    trend="up"
                    description="+5 novos hoje"
                    color="green" // Aproveitando as cores do componente
                />
                <StatsCard
                    title="Usuários Totais"
                    value={stats.total_users.toString()}
                    icon={Users}
                    trend="neutral"
                    description="Estável"
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lista de Uploads Recentes */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" /> Uploads Recentes
                    </h3>
                    <div className="space-y-4">
                        {stats.recent_documents.length === 0 ? (
                            <p className="text-sm text-slate-400">Nenhum documento recente.</p>
                        ) : (
                            stats.recent_documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">{doc.filename}</p>
                                            <p className="text-xs text-slate-500">
                                                {doc.created_at && format(new Date(doc.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                                        PDF
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Lista de Novas Empresas */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-slate-400" /> Novas Empresas
                    </h3>
                    <div className="space-y-4">
                        {stats.recent_companies.length === 0 ? (
                            <p className="text-sm text-slate-400">Nenhuma empresa recente.</p>
                        ) : (
                            stats.recent_companies.map((comp) => (
                                <div key={comp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded text-green-600">
                                            <Building2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{comp.razao_social || comp.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">{comp.cnpj}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}