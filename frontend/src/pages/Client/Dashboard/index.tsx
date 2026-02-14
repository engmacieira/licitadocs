import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileText, Building2, CheckCircle, XCircle, Download,
    AlertTriangle, ArrowRight, FileSignature, CreditCard, ShieldCheck, RefreshCw
} from 'lucide-react';

// Serviços e Contexto
import { dashboardService } from '../../../services/dashboardService';
import type { ClientStats } from '../../../services/dashboardService';
import { documentService } from '../../../services/documentService';
import { companyService } from '../../../services/companyService'; // Importar companyService
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

    // Estado local para armazenar os dados FRESCOS da empresa
    const [companyStatus, setCompanyStatus] = useState({
        contract: false,
        payment: false,
        approval: false
    });

    // --- CARREGAMENTO DE DADOS ---
    const loadData = useCallback(async () => {
        if (!currentCompany?.id) return;

        setLoading(true);
        try {
            // 1. Busca dados ATUALIZADOS da empresa (fura o cache do AuthContext)
            // Certifique-se que companyService.getById existe e retorna os campos booleanos
            const freshCompany = await companyService.getById(currentCompany.id) as any;

            // Atualiza status local com dados reais do banco
            const currentStatus = {
                contract: freshCompany.is_contract_signed || false,
                payment: freshCompany.is_payment_active || false,
                // CORREÇÃO: Usar is_admin_verified em vez de is_active
                approval: freshCompany.is_admin_verified || false
            };
            setCompanyStatus(currentStatus);

            // Verifica regularidade baseada nos dados novos
            const isRegular = currentStatus.contract && currentStatus.payment && currentStatus.approval;

            // 2. Se for regular, carrega as estatísticas
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
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(docId, filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        }
    }

    const isRegular = companyStatus.contract && companyStatus.payment && companyStatus.approval;

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

    // --- RENDER 2: WIZARD DE PENDÊNCIAS (Se não for regular) ---
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
                        Para liberar o acesso completo ao LicitaDoc e iniciar a emissão automática de certidões, precisamos concluir as etapas abaixo.
                    </p>
                    <Button variant="ghost" size="sm" onClick={loadData} className="mt-4 text-slate-400 hover:text-blue-600">
                        <RefreshCw className="mr-2 h-3 w-3" /> Atualizar Status
                    </Button>
                </div>

                <div className="grid gap-5">

                    {/* STEP 1: CONTRATO */}
                    <div className={`p-6 rounded-xl border-2 transition-all ${companyStatus.contract ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-white shadow-lg shadow-blue-100'}`}>
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.contract ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                                <FileSignature className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    1. Assinatura Digital
                                    {companyStatus.contract ?
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span> :
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                                    }
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Assinatura do contrato de prestação de serviços SaaS e procuração para emissão de certidões.
                                </p>
                            </div>
                            {!companyStatus.contract && (
                                <Button onClick={() => navigate('/contract-sign')}>
                                    Assinar Agora <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 2: PAGAMENTO */}
                    <div className={`p-6 rounded-xl border-2 transition-all ${companyStatus.payment ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.payment ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    2. Ativação do Plano
                                    {companyStatus.payment && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Confirmação do pagamento da primeira mensalidade para liberação do sistema.
                                </p>
                            </div>
                            {!companyStatus.payment && (
                                <Button
                                    variant={companyStatus.contract ? 'primary' : 'outline'}
                                    disabled={!companyStatus.contract}
                                    onClick={() => navigate('/payment')}
                                >
                                    Realizar Pagamento
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* STEP 3: VALIDAÇÃO */}
                    <div className={`p-6 rounded-xl border-2 transition-all ${companyStatus.approval ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className={`p-3 rounded-xl shrink-0 ${companyStatus.approval ? 'bg-green-200 text-green-700' : 'bg-amber-100 text-amber-600'}`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    3. Validação da Equipe
                                    {companyStatus.approval ?
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Aprovado</span> :
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Em Análise</span>
                                    }
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Nossa equipe está conferindo seus documentos (Contrato Social, CNPJ e Identidade).
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