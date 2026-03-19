import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileText, Building2, CheckCircle, Download,
    AlertTriangle, ArrowRight, FileSignature, CreditCard,
    ShieldCheck, RefreshCw, ScrollText, AlertOctagon, XOctagon, CheckCircle2
} from 'lucide-react';

// Serviços e Contexto
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';
import { companyService } from '../../../services/companyService';
import { useAuth } from '../../../contexts/AuthContext';

// Componentes UI
import { StatsCard } from '../../../components/ui/StatsCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';

export function Dashboard() {
    const { currentCompany } = useAuth();
    const navigate = useNavigate();

    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
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

            const currentStatus = {
                terms: freshCompany.is_terms_accepted || false,
                data: freshCompany.is_data_completed || false,
                payment: freshCompany.is_payment_active || false,
                contract: freshCompany.is_contract_signed || false,
                approval: freshCompany.is_admin_verified || false,
                pendencies: freshCompany.admin_pendencies || null
            };
            setCompanyStatus(currentStatus);

            const isRegular =
                currentStatus.terms &&
                currentStatus.data &&
                currentStatus.payment &&
                currentStatus.contract &&
                currentStatus.approval;

            // 2. Se for regular, carrega todos os documentos para o Dashboard
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

    // --- INTELIGÊNCIA DO DASHBOARD ---
    const dashboardData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validDocs = documents.filter(d => d.status === 'valid');

        // Pendências: Erro na emissão, Irregular ou Vencido
        const attentionDocs = documents.filter(d => {
            const isExpired = d.expiration_date ? new Date(d.expiration_date) < today : false;
            return d.status === 'error' || d.status === 'irregular' || d.status === 'expired' || isExpired;
        });

        // ÚLTIMAS ATUALIZAÇÕES: Pega os documentos válidos, ordena do mais recente para o mais antigo, limite de 5
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

    // --- RENDER 2: WIZARD DE PENDÊNCIAS (Mantido) ---
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

                {/* ALERTA DE PENDÊNCIAS DO ADMIN */}
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
                                <Button variant={companyStatus.terms ? 'primary' : 'outline'} disabled={!companyStatus.terms} onClick={() => navigate('/company-settings')} className="w-full sm:w-auto">
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
                                <Button variant={companyStatus.data ? 'primary' : 'outline'} disabled={!companyStatus.data} onClick={() => navigate('/payment')} className="w-full sm:w-auto">
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
                                <Button variant={companyStatus.payment ? 'primary' : 'outline'} disabled={!companyStatus.payment} onClick={() => navigate('/signature')} className="w-full sm:w-auto">
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

    // --- RENDER 3: DASHBOARD REAL DO CLIENTE ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header com Contexto */}
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
                    <Button variant="outline" onClick={() => loadData()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total no Cofre" value={dashboardData.total} icon={FileText} description="Documentos sob nossa gestão" color="blue" />
                <StatsCard title="Regulares" value={dashboardData.validDocs.length} icon={CheckCircle} description="Certidões ativas e em dia" color="green" />
                <StatsCard title="Atenção Necessária" value={dashboardData.attentionDocs.length} icon={AlertTriangle} description="Pendências na prefeitura ou órgãos" color={dashboardData.attentionDocs.length > 0 ? "red" : "green"} />
                <StatsCard title="Saúde Fiscal" value={`${dashboardData.healthScore}%`} icon={ShieldCheck} description="Índice de conformidade" color={dashboardData.healthScore === 100 ? "green" : "amber"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LADO ESQUERDO: PENDÊNCIAS (Ação Necessária) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertOctagon className="h-5 w-5 text-red-500" />
                            Ação Necessária
                        </h2>
                        {dashboardData.attentionDocs.length > 0 && (
                            <button onClick={() => navigate('/help-center')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Falar com Suporte
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                        {dashboardData.attentionDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                                <CheckCircle className="h-14 w-14 text-green-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">Tudo em conformidade!</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">Nenhum documento vencido ou com pendência de emissão no seu cofre.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {dashboardData.attentionDocs.map(doc => {
                                    const isError = doc.status === 'error';
                                    const isIrregular = doc.status === 'irregular';

                                    return (
                                        <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`p-2.5 rounded-lg shrink-0 ${isError ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {isError ? <XOctagon size={20} /> : <AlertTriangle size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate" title={doc.title || doc.filename}>
                                                        {doc.title || doc.filename}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : isIrregular ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isError ? 'Erro na Emissão' : isIrregular ? 'Irregularidade' : 'Vencido'}
                                                        </span>
                                                        <span className="text-xs text-slate-500 truncate" title={doc.filename}>{doc.filename}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate('/documents')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* LADO DIREITO: ÚLTIMAS ATUALIZAÇÕES DA EQUIPE (A MÁGICA PSICOLÓGICA) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            Últimas Atualizações no Cofre
                        </h2>
                        {dashboardData.recentDocs.length > 0 && (
                            <button onClick={() => navigate('/documents')} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                Acessar Cofre
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                        {dashboardData.recentDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
                                <RefreshCw className="h-14 w-14 text-slate-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">Monitoramento Ativo</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">A nossa equipa monitoriza a sua empresa diariamente. Assim que houver renovações, elas aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {dashboardData.recentDocs.map((doc) => (
                                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="p-2.5 rounded-lg bg-green-50 text-green-600 shrink-0 border border-green-100">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate" title={doc.title || doc.filename}>
                                                    {doc.title || doc.filename}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Processado em {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDownload(doc.id, doc.filename)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg shrink-0">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}