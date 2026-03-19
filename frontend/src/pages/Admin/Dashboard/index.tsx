import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, AlertTriangle, ShieldAlert,
    Clock, ArrowRight, FileText, XOctagon, CheckCircle2, FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';
import { StatsCard } from '../../../components/ui/StatsCard';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

export function AdminDashboard() {
    const navigate = useNavigate();

    // Estados Operacionais
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [expiringDocs, setExpiringDocs] = useState<DocumentDTO[]>([]);
    const [irregularDocs, setIrregularDocs] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            try {
                // Dispara todas as requisições em paralelo para o Dashboard carregar num piscar de olhos
                const [companiesData, expiringData, irregularData] = await Promise.all([
                    companyService.getAll(),
                    documentService.getExpiring(30), // Busca o que vence nos próximos 30 dias
                    documentService.getIrregular()   // Busca tudo que tem erro ou irregularidade
                ]);

                setTotalCompanies(companiesData.length);
                setExpiringDocs(expiringData);
                setIrregularDocs(irregularData);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, []);

    // Agrupa as irregularidades por empresa para mostrar na "Fila de Atenção"
    const groupedIrregular = useMemo(() => {
        const groups: Record<string, { companyName: string, count: number, type: 'error' | 'irregular' }> = {};

        irregularDocs.forEach(doc => {
            const compId = doc.company_id || 'unknown';
            if (!groups[compId]) {
                groups[compId] = {
                    companyName: doc.company_name || 'Empresa Desconhecida',
                    count: 0,
                    type: doc.status as 'error' | 'irregular' // Pega a maior gravidade (error > irregular)
                };
            }
            groups[compId].count += 1;
            if (doc.status === 'error') groups[compId].type = 'error'; // Sobrescreve se achar um erro grave
        });

        // Retorna um array ordenado pelas empresas com mais problemas
        return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
    }, [irregularDocs]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visão Operacional</h1>
                    <p className="text-sm text-slate-500">Acompanhamento de regularidade e saúde das empresas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/validity-monitor')}>
                        <ShieldAlert className="mr-2 h-4 w-4" /> Monitor Global
                    </Button>
                    <Button onClick={() => navigate('/admin/upload')} className="bg-blue-600 hover:bg-blue-700">
                        <FolderOpen className="mr-2 h-4 w-4" /> Central de Upload
                    </Button>
                </div>
            </div>

            {/* KPIs de Saúde da Operação */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                        title="Empresas na Base"
                        value={totalCompanies}
                        icon={Building2}
                        description="Clientes totais geridos"
                        color="blue"
                    />
                    <StatsCard
                        title="A Vencer (30 dias)"
                        value={expiringDocs.length}
                        icon={Clock}
                        description="Documentos que exigem renovação"
                        color={expiringDocs.length > 0 ? "amber" : "green"}
                    />
                    <StatsCard
                        title="Irregularidades / Erros"
                        value={irregularDocs.length}
                        icon={AlertTriangle}
                        description="Pendências bloqueantes ativas"
                        color={irregularDocs.length > 0 ? "red" : "green"}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Atenção Urgente (Irregularidades) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Atenção Urgente
                        </h2>
                        {irregularDocs.length > 0 && (
                            <button onClick={() => navigate('/admin/validity-monitor')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Ver todas as pendências
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        ) : groupedIrregular.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                                <CheckCircle2 className="h-14 w-14 text-green-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">Cofres Limpos</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">Não existem empresas com documentos irregulares ou com erro na emissão no momento.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {groupedIrregular.map((group, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${group.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {group.type === 'error' ? <XOctagon size={20} /> : <AlertTriangle size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-800 truncate" title={group.companyName}>{group.companyName}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${group.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {group.type === 'error' ? 'Erro na Emissão' : 'Irregular'}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {group.count} pendência{group.count > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="shrink-0 ml-4 hover:bg-slate-200" onClick={() => navigate('/admin/validity-monitor')}>
                                            Resolver <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Próximos Vencimentos */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" />
                            Próximos Vencimentos
                        </h2>
                        {expiringDocs.length > 0 && (
                            <button onClick={() => navigate('/admin/validity-monitor')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Ver calendário completo
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        ) : expiringDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                                <CheckCircle2 className="h-14 w-14 text-green-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">Tudo em dia</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">Não existem documentos ou certidões a vencer nos próximos 30 dias.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {expiringDocs.slice(0, 5).map((doc) => {
                                    // Pinta de vermelho se já venceu, amarelo se vai vencer
                                    const isExpired = new Date(doc.expiration_date!) < new Date(new Date().setHours(0, 0, 0, 0));

                                    return (
                                        <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-start gap-3 overflow-hidden">
                                                <div className="mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                                                    <FileText className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-sm text-slate-800 truncate" title={doc.title || doc.filename}>
                                                        {doc.title || doc.filename}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 truncate" title={doc.company_name}>
                                                        {doc.company_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center sm:justify-end shrink-0 pl-10 sm:pl-0">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${isExpired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    <Clock size={12} />
                                                    {isExpired ? 'Vencido em' : 'Vence a'} {format(new Date(doc.expiration_date!), 'dd/MM', { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}