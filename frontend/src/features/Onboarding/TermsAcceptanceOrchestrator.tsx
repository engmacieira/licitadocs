import { useState, useEffect } from 'react';
import type { UIEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ScrollText, FileText, ArrowRight, CheckCircle2, Lock, Unlock, X, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';

// Integrações
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Componentes UI
import { Button } from '../../components/ui/Button';

// Nossos componentes reaproveitáveis (Minutas Fonte Única de Verdade)
import { ContractContent } from '../../components/signature/ContractContent';
import { ProxyContent } from '../../components/signature/ProxyContent';
import { TermsOfAcceptanceContent } from '../../components/signature/TermsOfAcceptanceContent';

/**
 * Orquestrador do fluxo de Aceite de Termos e Minutas.
 * Gere a lógica complexa de obrigatoriedade de leitura (tracking de scroll),
 * controlo de modais de pré-visualização e regista o aceite final na API.
 */
export function TermsAcceptanceOrchestrator() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentCompany } = useAuth();

    const companyData = currentCompany as any;
    const companyName = companyData?.razao_social || location.state?.legalName || "Sua Empresa";

    /** Dados consolidados para injetar nas minutas (Mock visual) */
    const documentProps = {
        razaoSocial: companyName,
        cnpj: companyData?.cnpj || "00.000.000/0000-00",
        endereco: `${companyData?.logradouro || ''}, ${companyData?.numero || ''} - ${companyData?.cidade || ''}/${companyData?.estado || ''}`,
        responsavel: companyData?.responsavel_nome || "NOME DO RESPONSÁVEL",
        cpfResponsavel: companyData?.responsavel_cpf || "000.000.000-00",
        genero: companyData?.responsavel_genero || "outro",
        cidade: companyData?.cidade || "CIDADE",
        estado: companyData?.estado || "UF"
    };

    // --- ESTADOS DE CONTROLO ---
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // UX Legal: Estados do Checklist de Leitura
    const [hasReadTerms, setHasReadTerms] = useState(false);
    const [hasReadContract, setHasReadContract] = useState(false);
    const [hasReadProxy, setHasReadProxy] = useState(false);

    // Controlo do Modal (qual minuta está aberta)
    const [activeModal, setActiveModal] = useState<'contract' | 'proxy' | null>(null);

    // Progresso exclusivo do Termo Principal (na tela de fundo)
    const [termsScrollProgress, setTermsScrollProgress] = useState(0);

    // Derivação: Verifica se todos os 3 documentos foram lidos
    const isAllRead = hasReadTerms && hasReadContract && hasReadProxy;

    /**
     * Inicialização da tela principal.
     * Marca o termo como lido automaticamente se o ecrã for grande o suficiente.
     */
    useEffect(() => {
        const docContainer = document.getElementById('main-doc-content');
        if (docContainer) {
            docContainer.scrollTop = 0;
            if (docContainer.scrollHeight <= docContainer.clientHeight) {
                setHasReadTerms(true);
                setTermsScrollProgress(100);
            }
        }
    }, []);

    /**
     * Monitoriza a rolagem do Termo Principal para desbloquear a leitura.
     * @param {UIEvent<HTMLDivElement>} e - Evento de scroll nativo.
     */
    const handleTermsScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setTermsScrollProgress(progress);

        // Margem de 20px para melhorar a UX
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            setHasReadTerms(true);
        }
    };

    /**
     * Monitoriza a rolagem dentro dos Modais (Contrato e Procuração).
     * @param {UIEvent<HTMLDivElement>} e - Evento de scroll nativo.
     */
    const handleModalScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        if (scrollTop + clientHeight >= scrollHeight - 20) {
            if (activeModal === 'contract') setHasReadContract(true);
            if (activeModal === 'proxy') setHasReadProxy(true);
        }
    };

    /**
     * Submete o aceite final para a API, registando o progresso do Onboarding.
     */
    const handleAcceptTerms = async () => {
        if (!currentCompany?.id) {
            toast.error("Sessão não identificada", { description: "Tente fazer login novamente." });
            return;
        }

        setIsLoading(true);

        try {
            toast.loading("Registrando o seu aceite...", { id: 'terms-process' });
            await new Promise(resolve => setTimeout(resolve, 800)); // Delay UX

            // CHAMADA REAL À API (Lógica mantida intacta)
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=terms`);

            toast.dismiss('terms-process');
            toast.success("Termos aceitos com sucesso!", {
                icon: <CheckCircle2 className="text-green-600" />
            });

            navigate('/payment');
        } catch (error) {
            console.error(error);
            toast.dismiss('terms-process');
            toast.error("Erro ao registrar aceite", { description: "Falha na comunicação. Tente novamente." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative">

            {/* --- HEADER --- */}
            <div className="text-center max-w-2xl mb-8 animate-in slide-in-from-top-4 duration-500">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <ScrollText className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Termos de Uso e Minutas
                </h1>
                <p className="mt-2 text-slate-600">
                    Por favor, leia o Termo de Aceite abaixo e revise as minutas do Contrato e Procuração da <span className="text-slate-900 font-medium">{companyName}</span>.
                </p>
            </div>

            {/* --- VISUALIZADOR PRINCIPAL (TERMO DE ACEITE) --- */}
            <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px] animate-in slide-in-from-bottom-4 duration-500 delay-100 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 relative">
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            1. TERMO_DE_ACEITE_PREVIO.pdf
                        </span>
                        <div className="flex gap-1">
                            {hasReadTerms ? (
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-md transition-all">
                                    <Unlock className="h-3 w-3" /> Termo Lido
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-md transition-all">
                                    <Lock className="h-3 w-3" /> Role para liberar
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Barra de progresso do scroll */}
                    <div className="h-1 bg-slate-200 w-full absolute bottom-0">
                        <div className={`h-full transition-all duration-300 ${hasReadTerms ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${termsScrollProgress}%` }}></div>
                    </div>
                </div>

                <div id="main-doc-content" onScroll={handleTermsScroll} className="flex-1 overflow-y-auto p-8 text-sm text-slate-700 leading-relaxed bg-white">

                    <TermsOfAcceptanceContent />

                </div>
            </div>

            {/* --- MÓDULO DE CHECKLIST E ACEITE --- */}
            <div className="w-full max-w-3xl mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700 delay-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" /> Checklist de Leitura Obrigatória
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => setActiveModal('contract')}
                            className={`flex-1 flex items-center justify-between p-4 rounded-lg border-2 transition-all ${hasReadContract ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-100 hover:border-blue-300 bg-white text-slate-700 shadow-sm'}`}
                        >
                            <span className="font-medium flex items-center gap-2">
                                <FileText className={`h-5 w-5 ${hasReadContract ? 'text-green-500' : 'text-blue-500'}`} />
                                2. Contrato Principal
                            </span>
                            {hasReadContract ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <ExternalLink className="h-4 w-4 text-blue-400" />}
                        </button>

                        <button
                            onClick={() => setActiveModal('proxy')}
                            className={`flex-1 flex items-center justify-between p-4 rounded-lg border-2 transition-all ${hasReadProxy ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-100 hover:border-blue-300 bg-white text-slate-700 shadow-sm'}`}
                        >
                            <span className="font-medium flex items-center gap-2">
                                <FileText className={`h-5 w-5 ${hasReadProxy ? 'text-green-500' : 'text-blue-500'}`} />
                                3. Procuração Específica
                            </span>
                            {hasReadProxy ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <ExternalLink className="h-4 w-4 text-blue-400" />}
                        </button>
                    </div>
                </div>

                <div className={`p-6 transition-colors duration-500 ${isAllRead ? 'bg-blue-50/50' : 'bg-white'}`}>
                    <label className={`flex items-start gap-3 select-none ${isAllRead ? 'cursor-pointer group' : 'cursor-not-allowed opacity-50'}`}>
                        <div className="relative flex items-center justify-center mt-1 shrink-0">
                            <input
                                type="checkbox"
                                disabled={!isAllRead}
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 peer disabled:cursor-not-allowed cursor-pointer"
                            />
                        </div>
                        <span className="text-sm font-medium text-slate-700 leading-tight">
                            Declaro que li, compreendi e aceito integralmente o Termo de Aceite Prévio, e declaro ciência plena das minutas do Contrato de Prestação de Serviços e do Instrumento de Procuração revisadas acima.
                        </span>
                    </label>

                    {!isAllRead && (
                        <p className="mt-3 text-xs text-red-500 font-medium flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Conclua a leitura dos 3 documentos acima para liberar a assinatura.
                        </p>
                    )}
                </div>
            </div>

            {/* --- BOTÕES DE AÇÃO --- */}
            <div className="w-full max-w-3xl mt-8 flex justify-end gap-4 animate-in fade-in duration-700 delay-300">
                <Button variant="ghost" onClick={() => navigate('/')} disabled={isLoading}>Voltar</Button>
                <Button
                    size="lg"
                    onClick={handleAcceptTerms}
                    isLoading={isLoading}
                    disabled={!acceptedTerms}
                    className={`min-w-[200px] transition-all duration-300 ${!acceptedTerms ? 'opacity-50 grayscale' : 'shadow-lg shadow-blue-500/30'}`}
                >
                    {isLoading ? 'Registrando...' : 'Aceitar e Continuar'}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
            </div>

            {/* --- MODAIS DE LEITURA (SOBREPOSIÇÃO) --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-200 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    {activeModal === 'contract' ? 'Leitura da Minuta: Contrato Principal' : 'Leitura da Minuta: Procuração'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Role até o final do documento para registrar sua ciência.</p>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div onScroll={handleModalScroll} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/50 flex flex-col items-center">
                            <div className="bg-white p-10 shadow-md max-w-[21cm] w-full text-sm font-serif leading-relaxed text-slate-900 mx-auto">
                                {activeModal === 'contract' && (
                                    <>
                                        <h2 className="text-center font-bold text-lg mb-8 uppercase underline decoration-2 underline-offset-4">
                                            Contrato Prestação de Serviços de Tecnologia – {APP_CONFIG.name}
                                        </h2>
                                        <div className="space-y-4 text-justify">
                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 text-amber-800 text-xs text-center font-sans">
                                                <strong>Modo de Leitura:</strong> Esta é uma versão prévia. Os dados sensíveis da CONTRATADA estão protegidos. O documento completo será gerado após a validação do pagamento.
                                            </div>

                                            <p><strong>CONTRATADA:</strong> {APP_CONFIG.name.toUpperCase()} TECNOLOGIA (Dados protegidos nesta prévia).</p>
                                            <p><strong>CONTRATANTE:</strong> {documentProps.razaoSocial}, inscrita no CNPJ sob o nº {documentProps.cnpj}, com sede em {documentProps.endereco}.</p>

                                            <div className="border-t border-slate-300 my-6"></div>
                                            <ContractContent />
                                        </div>
                                    </>
                                )}

                                {activeModal === 'proxy' && (
                                    <>
                                        <h2 className="text-center font-bold text-lg mb-8 uppercase underline decoration-2 underline-offset-4">
                                            Instrumento Particular de Procuração
                                        </h2>
                                        <div className="space-y-5 text-justify">
                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 text-amber-800 text-xs text-center font-sans">
                                                <strong>Modo de Leitura:</strong> Esta é uma versão prévia. Os dados sensíveis da OUTORGADA estão protegidos.
                                            </div>

                                            <p><strong>OUTORGANTE (CONTRATANTE):</strong> {documentProps.razaoSocial}, CNPJ nº {documentProps.cnpj}.</p>
                                            <p><strong>OUTORGADA (PLATAFORMA {APP_CONFIG.name.toUpperCase()}):</strong> Dados protegidos nesta prévia.</p>

                                            <div className="border-t border-slate-300 my-6"></div>
                                            <ProxyContent />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Feedback visual de sucesso */}
                            {((activeModal === 'contract' && hasReadContract) || (activeModal === 'proxy' && hasReadProxy)) && (
                                <div className="mt-8 bg-green-100 text-green-800 px-6 py-3 rounded-full font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
                                    <CheckCircle2 className="h-5 w-5" /> Leitura registrada! Você já pode fechar esta janela.
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-4 border-t border-slate-200 flex justify-end shrink-0">
                            <Button variant="outline" onClick={() => setActiveModal(null)}>
                                Fechar e Voltar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}