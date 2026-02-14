import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileCheck, AlertCircle, TrendingUp,
    ArrowRight, CheckCircle2, Clock, Search
} from 'lucide-react';

import { adminService } from '../../../services/adminService';
import type { AdminStats, PendingAction } from '../../../services/adminService';
import { StatsCard } from '../../../components/ui/StatsCard';
import { Button } from '../../../components/ui/Button';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingQueue, setPendingQueue] = useState<PendingAction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, queueData] = await Promise.all([
                    adminService.getStats(),
                    adminService.getPendingQueue()
                ]);
                setStats(statsData);
                setPendingQueue(queueData);
            } catch (error) {
                console.error("Erro ao carregar admin dashboard", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Torre de Controle</h1>
                    <p className="text-sm text-slate-500">Visão geral da operação LicitaDoc</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/companies')}>
                        <Search className="mr-2 h-4 w-4" /> Buscar Empresa
                    </Button>
                    <Button onClick={() => navigate('/admin/upload')}>
                        <FileCheck className="mr-2 h-4 w-4" /> Upload Avulso
                    </Button>
                </div>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Carteira Total"
                    value={stats?.total_companies || 0}
                    icon={Users}
                    description="Empresas cadastradas"
                    color="blue"
                />
                <StatsCard
                    title="Assinantes Ativos"
                    value={stats?.active_companies || 0}
                    icon={CheckCircle2}
                    description="Pagamento em dia"
                    color="green"
                />
                <StatsCard
                    title="Fila de Aprovação"
                    value={stats?.pending_approval || 0}
                    icon={AlertCircle}
                    description="Aguardando validação"
                    color="amber"
                />
                <StatsCard
                    title="Docs Gerados (Mês)"
                    value={stats?.documents_generated_month || 0}
                    icon={TrendingUp}
                    description="Automação rodando"
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Fila de Trabalho (Prioridade) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            Pendências de Onboarding
                        </h2>
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            {pendingQueue.length} aguardando
                        </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {pendingQueue.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-200 mb-3" />
                                <p>Tudo limpo! Nenhuma pendência na fila.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {pendingQueue.map((item) => (
                                    <div key={item.company_id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{item.company_name}</h3>
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    Registrado em {new Date(item.date).toLocaleDateString()}
                                                </p>
                                                <div className="mt-1 flex gap-2">
                                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                                                        Validar Documentos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/admin/companies/${item.company_id}/validate`)}
                                        >
                                            Analisar <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Atalhos e Alertas do Sistema */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Robô de Captura</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-sm text-slate-300">Sistema Operante</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">
                                Próxima varredura automática agendada para as 02:00 AM.
                            </p>
                            <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-white">
                                Ver Logs de Erro
                            </Button>
                        </div>
                        {/* Decorativo */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-3">Atalhos Rápidos</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex justify-between group">
                                <span>Cadastrar Cliente Manualmente</span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex justify-between group">
                                <span>Exportar Relatório Mensal</span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}