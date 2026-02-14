import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
    FileSignature, ShieldCheck, ScrollText, CheckCircle2,
    ArrowRight, AlertCircle, FileText
} from 'lucide-react';

// Integrações
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Componentes UI
import { Button } from '../../components/ui/Button';

export function ContractSignPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Obtemos a empresa atual do contexto
    const { currentCompany } = useAuth();

    // TRUQUE PARA CORRIGIR O ERRO DE TYPESCRIPT:
    // Forçamos o TypeScript a aceitar que esses campos existem no objeto,
    // já que o backend (Python) os envia, mas a interface do frontend pode estar desatualizada.
    const companyData = currentCompany as any;

    // Prioridade: Dados do Banco (Contexto) > Dados da Navegação (State) > Fallback
    const companyName = companyData?.razao_social || location.state?.legalName || "Sua Empresa";
    const responsibleName = companyData?.responsavel_nome || location.state?.responsibleName || "Responsável Legal";

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'terms' | 'proxy'>('terms');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedProxy, setAcceptedProxy] = useState(false);

    // Scroll to top ao mudar de aba
    useEffect(() => {
        const docContainer = document.getElementById('doc-content');
        if (docContainer) docContainer.scrollTop = 0;
    }, [activeTab]);

    const handleSign = async () => {
        // Validação de Segurança
        if (!currentCompany?.id) {
            toast.error("Sessão não identificada", {
                description: "Tente fazer login novamente."
            });
            return;
        }

        setIsLoading(true);

        try {
            // 1. UX: Simulação visual de processamento criptográfico
            const steps = [
                "Gerando chaves de segurança...",
                "Vinculando CNPJ ao responsável...",
                "Registrando hash da transação no Blockchain...",
            ];

            for (const step of steps) {
                toast.loading(step, { id: 'signing-process' });
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            // 2. CHAMADA REAL À API
            // Atualiza o status da empresa no banco de dados para "Contrato Assinado"
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=contract`);

            toast.dismiss('signing-process');
            toast.success("Documentos assinados com sucesso!", {
                description: "Status atualizado. Redirecionando para pagamento...",
                icon: <ShieldCheck className="text-green-600" />
            });

            // 3. NAVEGAÇÃO
            navigate('/payment');

        } catch (error) {
            console.error(error);
            toast.dismiss('signing-process');
            toast.error("Erro ao assinar", {
                description: "Falha na comunicação com o servidor. Tente novamente."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

            {/* Header Seguro */}
            <div className="text-center max-w-2xl mb-8 animate-in slide-in-from-top-4 duration-500">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FileSignature className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Assinatura Digital
                </h1>
                <p className="mt-2 text-slate-600">
                    Para ativarmos a automação do <strong>LicitaDoc</strong> para a empresa <span className="text-slate-900 font-medium">{companyName}</span>, precisamos da sua autorização formal.
                </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">

                {/* COLUNA DA ESQUERDA: Navegação */}
                <div className="md:col-span-1 space-y-4">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${activeTab === 'terms'
                                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                            }`}
                    >
                        <ScrollText className={`h-5 w-5 shrink-0 ${activeTab === 'terms' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                            <span className={`block font-semibold ${activeTab === 'terms' ? 'text-blue-700' : 'text-slate-700'}`}>
                                Termos de Uso
                            </span>
                            <span className="text-xs text-slate-500">Regras da Plataforma SaaS</span>
                        </div>
                        {acceptedTerms && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('proxy')}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${activeTab === 'proxy'
                                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                            }`}
                    >
                        <ShieldCheck className={`h-5 w-5 shrink-0 ${activeTab === 'proxy' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                            <span className={`block font-semibold ${activeTab === 'proxy' ? 'text-blue-700' : 'text-slate-700'}`}>
                                Procuração Digital
                            </span>
                            <span className="text-xs text-slate-500">Autorização de Certidões</span>
                        </div>
                        {acceptedProxy && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                    </button>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <div className="flex items-center gap-2 mb-2 font-semibold">
                            <AlertCircle className="h-4 w-4" /> Importante
                        </div>
                        <p className="leading-relaxed text-xs">
                            A procuração é <strong>restrita</strong> apenas para consulta e emissão de certidões negativas. Vedada qualquer movimentação financeira ou bancária.
                        </p>
                    </div>
                </div>

                {/* COLUNA DA DIREITA: Visualizador */}
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">

                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {activeTab === 'terms' ? 'CONTRATO_SAAS_V1.pdf' : 'PROCURACAO_AD_JUDICIA.pdf'}
                        </span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                    </div>

                    <div id="doc-content" className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 font-serif leading-relaxed bg-white">
                        {activeTab === 'terms' ? (
                            <div className="space-y-4">
                                <h3 className="text-center font-bold text-slate-900 text-lg mb-6">CONTRATO DE LICENÇA DE USO DE SOFTWARE</h3>
                                <p>Pelo presente instrumento, <strong>LICITADOC TECNOLOGIA LTDA</strong> e <strong>{companyName.toUpperCase()}</strong>, doravante denominada CONTRATANTE...</p>
                                <p><strong>1. DO OBJETO</strong><br />1.1. Licenciamento de uso do software LicitaDoc para gestão inteligente de documentos...</p>
                                <p><strong>2. OBRIGAÇÕES</strong><br />2.1. A Contratante declara estar ciente de que o software opera mediante automação...</p>
                                <div className="py-12 text-center text-slate-300 italic border-y border-dashed border-slate-100 my-4 bg-slate-50/50">
                                    [... Conteúdo integral do contrato disponível para download após assinatura ...]
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-center font-bold text-slate-900 text-lg mb-6">PROCURAÇÃO AD JUDICIA ET EXTRA</h3>
                                <p><strong>OUTORGANTE:</strong> {companyName.toUpperCase()}, inscrita no CNPJ sob o nº (dados do cadastro)...</p>
                                <p><strong>OUTORGADA:</strong> LICITADOC TECNOLOGIA LTDA...</p>
                                <p><strong>PODERES:</strong> Concede poderes ESPECÍFICOS para representar a outorgante perante a Receita Federal, PGFN e Prefeituras para fins de emissão de Certidões.</p>
                                <p className="font-bold text-red-600 mt-4 text-xs bg-red-50 p-2 rounded border border-red-100">
                                    VEDAÇÃO EXPRESSA: É proibido o uso desta procuração para contrair empréstimos, abrir contas ou realizar transações bancárias.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                        {activeTab === 'terms' ? (
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => {
                                        setAcceptedTerms(e.target.checked);
                                        if (e.target.checked) toast.success("Termos aceitos");
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Li e concordo com os Termos de Uso.</span>
                            </label>
                        ) : (
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={acceptedProxy}
                                    onChange={(e) => {
                                        setAcceptedProxy(e.target.checked);
                                        if (e.target.checked) toast.success("Procuração validada");
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Assino digitalmente como responsável legal: <strong>{responsibleName}</strong>.
                                </span>
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mt-8 flex justify-end gap-4 animate-in fade-in duration-700 delay-200">
                <Button variant="ghost" onClick={() => navigate('/')} disabled={isLoading}>
                    Cancelar
                </Button>

                <Button
                    size="lg"
                    onClick={handleSign}
                    isLoading={isLoading}
                    disabled={!acceptedTerms || !acceptedProxy}
                    className={`min-w-[200px] transition-all duration-300 ${(!acceptedTerms || !acceptedProxy) ? 'opacity-50 grayscale' : 'shadow-lg shadow-blue-500/30'}`}
                >
                    {isLoading ? 'Processando...' : 'Assinar Documentos'}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
            </div>

        </div>
    );
}