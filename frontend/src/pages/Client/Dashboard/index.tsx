import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileText, Building2, CheckCircle, XCircle, Download,
    AlertTriangle, ArrowRight, FileSignature, CreditCard,
    ShieldCheck, RefreshCw, ScrollText, AlertOctagon
} from 'lucide-react';

// Serviços e Contexto
import { dashboardService } from '../../../services/dashboardService';
import type { ClientStats } from '../../../services/dashboardService';
import { documentService } from '../../../services/documentService';
import { companyService } from '../../../services/companyService';
import { useAuth } from '../../../contexts/AuthContext';

// Componentes UI
import { StatsCard } from '../../../components/ui/StatsCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';

export function Dashboard() {
    const { currentCompany } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    // Estado local Expandido (US-2404: 5 Passos + Pendências)
    const [companyStatus, setCompanyStatus] = useState({
        terms: false,
        data: false,
        payment: false,
        contract: false,
        approval: false,
        pendencies: null as string | null
    });

    // --- CARREGAMENTO DE DADOS ---
    const loadData = useCallback(async () => {
        if (!currentCompany?.id) return;

        setLoading(true);
        try {
            // 1. Busca dados ATUALIZADOS da empresa
            const freshCompany = await companyService.getById(currentCompany.id) as any;

            // Atualiza status local com as 5 flags da Sprint 24
            const currentStatus = {
                terms: freshCompany.is_terms_accepted || false,
                data: freshCompany.is_data_completed || false,
                payment: freshCompany.is_payment_active || false,
                contract: freshCompany.is_contract_signed || false,
                approval: freshCompany.is_admin_verified || false,
                pendencies: freshCompany.admin_pendencies || null
            };
            setCompanyStatus(currentStatus);

            // Verifica regularidade TOTAL (Os 5 passos precisam ser True)
            const isRegular =
                currentStatus.terms &&
                currentStatus.data &&
                currentStatus.payment &&
                currentStatus.contract &&
                currentStatus.approval;

            // 2. Se for regular, carrega as estatísticas do Cofre
            if (isRegular) {
                const data = await dashboardService.getClientStats(currentCompany.id);
                setStats(data);
            } else {
                setStats(null); // Garante que mostre o Wizard
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

    async function handleDownload(docId: string, filename: string) {
        if (isDownloading) return;
        try {
            setIsDownloading(true);
            toast.info("Iniciando download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        } finally {
            setIsDownloading(false);
        }
    }

    const isRegular =
        companyStatus.terms &&
        companyStatus.data &&
        companyStatus.payment &&
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
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <div className="h-64 bg-slate-200 rounded-lg"></div>
            </div>
        );
    }

    // --- RENDER 2: WIZARD DE PENDÊNCIAS (5 Passos) ---
    if (!isRegular && currentCompany) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-50 rounded-full mb-4 ring-1 ring-amber-200">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Finalize a configuração da <span className="text-blue-600">{currentCompany.razao_social}</span>
                    </h1>
                    <p className="text-slate-600 mt-3 max-w-xl mx-auto leading-relaxed">
                        Para liberar o acesso completo ao LicitaDocs, siga as etapas de regularização abaixo.
                    </p>
                    <Button variant="ghost" size="sm" onClick={loadData} className="mt-4 text-slate-400 hover:text-blue-600">
                        <RefreshCw className="mr-2 h-3 w-3" /> Atualizar Status
                    </Button>
                </div>

                {/* ALERTA DE PENDÊNCIAS DO ADMIN (US-2406) */}
                {companyStatus.pendencies && (
                    <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start shadow-sm">
                        <AlertOctagon className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-red-900">Atenção! Pendências na sua conta:</h3>
                            <p className="text-red-700 mt-1 whitespace-pre-wrap text-sm">{companyStatus.pendencies}</p>
                            <p className="text-red-600 mt-3 text-xs font-semibold">Por favor, corrija os itens apontados para que a nossa equipa possa validar a sua empresa.</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4">

                    {/* STEP 1: TERMOS DE USO */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.terms ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-white shadow-md shadow-blue-50'}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.terms ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                                <ScrollText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                    1. Aceite dos Termos
                                    {companyStatus.terms ?
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span> :
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                                    }
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">Concordância com os Termos de Uso e Política de Privacidade da plataforma.</p>
                            </div>
                            {!companyStatus.terms && (
                                <Button onClick={() => navigate('/contract-sign')} className="w-full sm:w-auto">
                                    Ler e Aceitar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 2: DADOS DA EMPRESA */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.data ? 'border-green-200 bg-green-50' : (companyStatus.terms ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.data ? 'bg-green-200 text-green-700' : (companyStatus.terms ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                    2. Dados Cadastrais
                                    {companyStatus.data && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">Preenchimento completo dos dados da empresa e responsável legal.</p>
                            </div>
                            {!companyStatus.data && (
                                <Button
                                    variant={companyStatus.terms ? 'primary' : 'outline'}
                                    disabled={!companyStatus.terms}
                                    onClick={() => navigate('/company-settings')}
                                    className="w-full sm:w-auto"
                                >
                                    Completar Dados
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 3: PAGAMENTO */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.payment ? 'border-green-200 bg-green-50' : (companyStatus.data ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.payment ? 'bg-green-200 text-green-700' : (companyStatus.data ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                    3. Ativação do Plano
                                    {companyStatus.payment && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">Confirmação da assinatura do serviço.</p>
                            </div>
                            {!companyStatus.payment && (
                                <Button
                                    variant={companyStatus.data ? 'primary' : 'outline'}
                                    disabled={!companyStatus.data}
                                    onClick={() => navigate('/payment')}
                                    className="w-full sm:w-auto"
                                >
                                    Realizar Pagamento
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 4: CONTRATO E PROCURAÇÃO */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.contract ? 'border-green-200 bg-green-50' : (companyStatus.payment ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.contract ? 'bg-green-200 text-green-700' : (companyStatus.payment ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                                <FileSignature className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                    4. Contrato e Procuração
                                    {companyStatus.contract && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">Assinatura digital dos documentos de representação.</p>
                            </div>
                            {!companyStatus.contract && (
                                <Button
                                    variant={companyStatus.payment ? 'primary' : 'outline'}
                                    disabled={!companyStatus.payment}
                                    onClick={() => navigate('/signature')} // <--- ALTERA AQUI DE '/contract-sign' PARA '/signature'
                                    className="w-full sm:w-auto"
                                >
                                    Assinar Documentos
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 5: VALIDAÇÃO */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.approval ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.approval ? 'bg-green-200 text-green-700' : 'bg-amber-100 text-amber-600'}`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                    5. Validação da Equipe
                                    {companyStatus.approval ?
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Aprovado</span> :
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Em Análise</span>
                                    }
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Nossa equipe fará a conferência final dos seus dados e documentos.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // --- RENDER 3: DASHBOARD REAL ---
    if (!stats) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header com Contexto */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{stats.company_name}</span>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            <CheckCircle className="h-3 w-3" /> Regular
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadData()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total de Documentos" value={stats.total_docs} icon={FileText} description="Arquivos no cofre" color="blue" />
                <StatsCard title="Válidos" value={stats.docs_valid} icon={CheckCircle} description="Certidões em dia" color="green" />
                <StatsCard title="Vencidos / Inválidos" value={stats.docs_expired} icon={XCircle} description="Requer atenção" color="red" />
                <StatsCard title="Saúde Fiscal" value={stats.docs_expired === 0 && stats.total_docs > 0 ? "100%" : `${Math.round((stats.docs_valid / (stats.total_docs || 1)) * 100)}%`} icon={Building2} description="Índice de conformidade" color="blue" />
            </div>

            {/* Lista de Documentos Recentes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">Últimas Atualizações</h2>
                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm" onClick={() => navigate('/documents')}>Ver tudo &rarr;</Button>
                </div>

                <div className="p-6 space-y-3">
                    {stats.recent_docs.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhum documento encontrado.</p>
                        </div>
                    ) : (
                        stats.recent_docs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-lg ${doc.status === 'valid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{doc.title || doc.filename}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <span>{doc.created_at && format(new Date(doc.created_at), "dd MMM, HH:mm", { locale: ptBR })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${doc.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {doc.status === 'valid' ? 'Válido' : 'Vencido'}
                                    </span>
                                    <button onClick={() => handleDownload(doc.id, doc.filename)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}