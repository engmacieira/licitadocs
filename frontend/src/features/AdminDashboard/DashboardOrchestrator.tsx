import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertTriangle, ShieldAlert, Clock, FolderOpen, UserPlus } from 'lucide-react';

// Integrações e Serviços
import { companyService, type Company } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '@/types';

// Componentes Genéricos UI
import { StatsCard } from '../../components/ui/StatsCard';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

// Subcomponentes da Feature
import { UrgentAttentionPanel } from './components/UrgentAttentionPanel';
import { ExpiringDocsPanel } from './components/ExpiringDocsPanel';
import { PendingCompaniesPanel } from './components/PendingCompaniesPanel';

/**
 * Orquestrador principal do Admin Dashboard.
 * Responsável por buscar as métricas vitais da plataforma em paralelo,
 * processar os agrupamentos de dados (Pendências por empresa) e 
 * distribuir as informações para os painéis visuais.
 */
export function DashboardOrchestrator() {
    const navigate = useNavigate();

    // --- ESTADOS DE DADOS (KPIs) ---
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
    const [expiringDocs, setExpiringDocs] = useState<DocumentDTO[]>([]);
    const [irregularDocs, setIrregularDocs] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Carrega todas as métricas do dashboard em paralelo para otimizar a performance.
     */
    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            try {
                const [companiesData, expiringData, irregularData] = await Promise.all([
                    companyService.getAll(),
                    documentService.getExpiring(30),
                    documentService.getIrregular()
                ]);

                setTotalCompanies(companiesData.length);
                setPendingCompanies(companiesData.filter(c => !c.is_admin_verified));
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

    /**
     * Processa a lista de documentos irregulares, agrupando-os por empresa
     * para exibir um "Top 5" de clientes que precisam de atenção urgente.
     */
    const groupedIrregular = useMemo(() => {
        const groups: Record<string, { companyName: string, count: number, type: 'error' | 'irregular' }> = {};

        irregularDocs.forEach(doc => {
            const compId = doc.company_id || 'unknown';
            if (!groups[compId]) {
                groups[compId] = {
                    companyName: doc.company_name || 'Empresa Desconhecida',
                    count: 0,
                    type: doc.status as 'error' | 'irregular'
                };
            }
            groups[compId].count += 1;
            // Se a empresa tiver um erro grave na emissão, a gravidade visual sobe
            if (doc.status === 'error') groups[compId].type = 'error';
        });

        // Retorna o Top 5 empresas com mais problemas
        return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [irregularDocs]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* Cabeçalho da Página */}
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

            {/* Grid de KPIs (Health Check) */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Empresas na Base"
                        value={totalCompanies}
                        icon={Building2}
                        description="Clientes totais geridos"
                        color="blue"
                    />
                    <StatsCard
                        title="Novos Cadastros"
                        value={pendingCompanies.length}
                        icon={UserPlus}
                        description="Aguardando validação"
                        color={pendingCompanies.length > 0 ? "indigo" : "green"}
                    />
                    <StatsCard
                        title="A Vencer (30 dias)"
                        value={expiringDocs.length}
                        icon={Clock}
                        description="Exigem renovação"
                        color={expiringDocs.length > 0 ? "amber" : "green"}
                    />
                    <StatsCard
                        title="Irregularidades"
                        value={irregularDocs.length}
                        icon={AlertTriangle}
                        description="Pendências ativas"
                        color={irregularDocs.length > 0 ? "red" : "green"}
                    />
                </div>
            )}

            {/* Painéis Visuais Isolados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PendingCompaniesPanel
                    loading={loading}
                    companies={pendingCompanies}
                />

                <UrgentAttentionPanel
                    loading={loading}
                    groupedIrregular={groupedIrregular}
                    onNavigate={() => navigate('/admin/validity-monitor')}
                />

                <ExpiringDocsPanel
                    loading={loading}
                    expiringDocs={expiringDocs}
                    onNavigate={() => navigate('/admin/validity-monitor')}
                />
            </div>
        </div>
    );
}