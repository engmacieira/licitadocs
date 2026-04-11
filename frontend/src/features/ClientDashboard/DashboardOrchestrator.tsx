import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, CheckCircle, AlertTriangle, ShieldCheck, FileText, FileSignature, RefreshCw } from 'lucide-react';

// Serviços e Contexto
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { companyService } from '../../services/companyService';
import { userService } from '../../services/userService'
import { useAuth } from '../../contexts/AuthContext';

// Componentes UI Puros
import { StatsCard } from '../../components/ui/StatsCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';

// Subcomponentes da Feature
import { OnboardingWizard } from './components/OnboardingWizard';
import { ActionNeededPanel } from './components/ActionNeededPanel';
import { RecentUpdatesPanel } from './components/RecentUpdatesPanel';

/**
 * Orquestrador do Dashboard do Cliente.
 * Decide se o utilizador deve ver o Assistente de Onboarding (se tiver pendências
 * de cadastro/pagamento) ou o Dashboard Real (com KPIs e documentos).
 * Realiza os cálculos de Saúde Fiscal e organiza os documentos recentes.
 */
export function DashboardOrchestrator() {
    const { currentCompany } = useAuth();
    const navigate = useNavigate();

    // --- ESTADOS DE DADOS ---
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    // --- ESTADOS DE ONBOARDING ---
    const [companyStatus, setCompanyStatus] = useState({
        terms: false,
        data: false,
        payment: false,
        emailVerified: false,
        contract: false,
        approval: false,
        pendencies: null as string | null
    });

    /**
     * Carrega o status de regularização da empresa e, se estiver regular,
     * busca o cofre de documentos para popular o dashboard.
     */
    const loadData = useCallback(async () => {
        if (!currentCompany?.id) return;

        setLoading(true);
        try {
            const freshCompany = await companyService.getById(currentCompany.id) as any;
            const me = await userService.getMe();

            const currentStatus = {
                terms: freshCompany.is_terms_accepted || false,
                data: freshCompany.is_data_completed || false,
                payment: freshCompany.is_payment_active || false,
                emailVerified: me.is_email_verified || false,
                contract: freshCompany.is_contract_signed || false,
                approval: freshCompany.is_admin_verified || false,
                pendencies: freshCompany.admin_pendencies || null
            };
            setCompanyStatus(currentStatus);

            const isRegular =
                currentStatus.terms &&
                currentStatus.data &&
                currentStatus.payment &&
                currentStatus.emailVerified &&
                currentStatus.contract &&
                currentStatus.approval;

            if (isRegular) {
                const docs = await documentService.getAll(currentCompany.id);
                // Filtramos os arquivados para não sujarem os indicadores
                setDocuments(docs.filter(d => d.status !== 'archived'));
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    }, [currentCompany?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * Gere o download de ficheiros do cofre.
     */
    async function handleDownload(docId: string, filename: string) {
        if (isDownloading) return;
        try {
            setIsDownloading(true);
            toast.info("A iniciar download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        } finally {
            setIsDownloading(false);
        }
    }

    /**
     * MÁGICA: Cálculos de KPIs do Dashboard (Saúde Fiscal, Recentes e Pendências).
     */
    const dashboardData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validDocs = documents.filter(d => d.status === 'valid');

        const attentionDocs = documents.filter(d => {
            const isExpired = d.expiration_date ? new Date(d.expiration_date) < today : false;
            return d.status === 'error' || d.status === 'irregular' || d.status === 'expired' || isExpired;
        });

        const recentDocs = [...validDocs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        const healthScore = documents.length > 0
            ? Math.round((validDocs.length / documents.length) * 100)
            : 100;

        return { validDocs, attentionDocs, recentDocs, healthScore, total: documents.length };
    }, [documents]);

    const isRegular =
        companyStatus.terms &&
        companyStatus.data &&
        companyStatus.payment &&
        companyStatus.emailVerified &&
        companyStatus.contract &&
        companyStatus.approval;

    // --- RENDER 1: LOADING ---
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-slate-200 rounded"></div>
                    <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <div className="h-64 bg-slate-200 rounded-lg"></div>
            </div>
        );
    }

    // --- RENDER 2: WIZARD DE ONBOARDING ---
    if (!isRegular && currentCompany) {
        return (
            <OnboardingWizard
                currentCompany={currentCompany}
                companyStatus={companyStatus}
                loadData={loadData}
            />
        );
    }

    // --- RENDER 3: DASHBOARD REAL ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Resumo do Cofre</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{currentCompany?.razao_social}</span>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            <CheckCircle className="h-3 w-3" /> Monitoramento Ativo
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/document-templates')}>
                        <FileSignature className="mr-2 h-4 w-4" /> Gerar Declarações
                    </Button>
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total no Cofre" value={dashboardData.total} icon={FileText} description="Documentos sob nossa gestão" color="blue" />
                <StatsCard title="Regulares" value={dashboardData.validDocs.length} icon={CheckCircle} description="Certidões ativas e em dia" color="green" />
                <StatsCard title="Atenção Necessária" value={dashboardData.attentionDocs.length} icon={AlertTriangle} description="Pendências na prefeitura ou órgãos" color={dashboardData.attentionDocs.length > 0 ? "red" : "green"} />
                <StatsCard title="Saúde Fiscal" value={`${dashboardData.healthScore}%`} icon={ShieldCheck} description="Índice de conformidade" color={dashboardData.healthScore === 100 ? "green" : "amber"} />
            </div>

            {/* Painéis Inferiores Isolados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ActionNeededPanel attentionDocs={dashboardData.attentionDocs} />
                <RecentUpdatesPanel recentDocs={dashboardData.recentDocs} handleDownload={handleDownload} />
            </div>
        </div>
    );
}