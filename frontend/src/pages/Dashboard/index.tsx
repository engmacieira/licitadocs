import { StatsCard } from '../../components/ui/StatsCard';
import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="space-y-6">

            {/* Cabeçalho da Página */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
                <p className="text-slate-500">Acompanhe a saúde documental da sua empresa.</p>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total de Documentos"
                    value="128"
                    icon={FileText}
                    description="12 adicionados este mês"
                    trend="up"
                />
                <StatsCard
                    title="Vencendo em Breve"
                    value="3"
                    icon={Clock}
                    description="Próximos 7 dias"
                    trend="down" // down aqui pode ser 'alerta'
                />
                <StatsCard
                    title="Documentos Irregulares"
                    value="1"
                    icon={AlertTriangle}
                    description="Ação necessária imediata"
                />
                <StatsCard
                    title="Regularidade Fiscal"
                    value="98%"
                    icon={CheckCircle}
                    description="Sua empresa está saudável"
                    trend="up"
                />
            </div>

            {/* Área de Conteúdo Principal (Placeholder para Tabela ou Gráfico) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px]">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Atividade Recente</h2>
                <div className="border-2 border-dashed border-slate-100 rounded-lg h-64 flex items-center justify-center text-slate-400">
                    Gráfico ou Lista de Últimos Documentos virá aqui...
                </div>
            </div>
        </div>
    );
}