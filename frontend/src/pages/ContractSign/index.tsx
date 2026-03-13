import { useState, useEffect } from 'react';
import type { UIEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ScrollText, FileText, ArrowRight, CheckCircle2, Lock, Unlock, X, ExternalLink } from 'lucide-react';

// Integrações
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Componentes UI
import { Button } from '../../components/ui/Button';

// Nossos componentes reaproveitáveis (Ajuste o caminho se necessário)
import { ContractDocument } from '../../components/signature/ContractDocument';
import { ProxyDocument } from '../../components/signature/ProxyDocument';

export function ContractSignPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentCompany } = useAuth();

    const companyData = currentCompany as any;
    const companyName = companyData?.razao_social || location.state?.legalName || "Sua Empresa";

    // Dados consolidados para injetar nas minutas
    const documentProps = {
        razaoSocial: companyName,
        cnpj: companyData?.cnpj || "00.000.000/0000-00",
        endereco: `${companyData?.logradouro || ''}, ${companyData?.numero || ''} - ${companyData?.cidade || ''}/${companyData?.estado || ''}`,
        responsavel: companyData?.responsavel_nome || "NOME DO RESPONSÁVEL",
        cpfResponsavel: companyData?.responsavel_cpf || "000.000.000-00",
        genero: companyData?.responsavel_genero || "outro"
    };

    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // UX Legal: Estados do Checklist de Leitura
    const [hasReadTerms, setHasReadTerms] = useState(false);
    const [hasReadContract, setHasReadContract] = useState(false);
    const [hasReadProxy, setHasReadProxy] = useState(false);

    // Controle do Modal
    const [activeModal, setActiveModal] = useState<'contract' | 'proxy' | null>(null);

    // Progresso exclusivo do Termo Principal (na tela de fundo)
    const [termsScrollProgress, setTermsScrollProgress] = useState(0);

    // Verifica se todos os 3 documentos foram lidos
    const isAllRead = hasReadTerms && hasReadContract && hasReadProxy;

    // Inicialização da tela principal
    useEffect(() => {
        const docContainer = document.getElementById('main-doc-content');
        if (docContainer) {
            docContainer.scrollTop = 0;
            // Se o conteúdo couber na tela inteira, já marca como lido
            if (docContainer.scrollHeight <= docContainer.clientHeight) {
                setHasReadTerms(true);
                setTermsScrollProgress(100);
            }
        }
    }, []);

    // Monitora a rolagem do Termo Principal
    const handleTermsScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setTermsScrollProgress(progress);

        // Damos uma margem de 20px para não ser chato com o usuário
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            setHasReadTerms(true);
        }
    };

    // Monitora a rolagem dentro dos Modais (Contrato e Procuração)
    const handleModalScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        if (scrollTop + clientHeight >= scrollHeight - 20) {
            if (activeModal === 'contract') setHasReadContract(true);
            if (activeModal === 'proxy') setHasReadProxy(true);
        }
    };

    const handleAcceptTerms = async () => {
        if (!currentCompany?.id) {
            toast.error("Sessão não identificada", { description: "Tente fazer login novamente." });
            return;
        }

        setIsLoading(true);

        try {
            toast.loading("Registrando o seu aceite...", { id: 'terms-process' });
            await new Promise(resolve => setTimeout(resolve, 800)); // Delay de UX para dar feedback visual

            // CHAMADA REAL À API
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

            {/* Header */}
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

            {/* Visualizador do Documento Principal */}
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
                    <div className="space-y-5 max-w-2xl mx-auto text-justify">

                        <h2 className="text-center font-bold text-slate-900 text-lg mb-8 uppercase">
                            Termo de Aceite e Condições Prévias de Uso - LicitaDocs
                        </h2>

                        <p>
                            Pelo presente <strong>Termo de Aceite</strong>, a empresa contratante ("CONTRATANTE"), ao clicar no botão correspondente a "Li e Aceito" e prosseguir com a assinatura da plataforma, declara estar ciente e de pleno acordo com as condições prévias para a utilização do sistema <strong>LicitaDocs</strong>, plataforma web especializada na gestão, busca e disponibilização de certidões de regularidade e documentos atinentes à Lei nº 14.133/2021 ("CONTRATADA").
                        </p>

                        <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">1. NATUREZA DO SERVIÇO E OBRIGAÇÃO DE MEIO</h3>
                        <p><strong>1.1.</strong> A CONTRATANTE compreende que o serviço prestado consiste na automação e facilitação da captação de certidões de regularidade (fiscal, trabalhista, previdenciária, entre outras) em bases de dados públicas e sua respectiva disponibilização no cofre digital da plataforma.</p>
                        <p><strong>1.2.</strong> Fica expressamente acordado que a prestação do serviço configura <strong>obrigação de meio</strong>, uma vez que a emissão dos referidos documentos depende exclusivamente da disponibilidade, estabilidade e processamento dos portais e sistemas dos respectivos órgãos emissores (Federais, Estaduais e Municipais).</p>
                        <p><strong>1.3.</strong> A CONTRATADA não poderá ser responsabilizada por atrasos, falhas ou impossibilidade de emissão de certidões decorrentes de indisponibilidade técnica dos sistemas governamentais ou de pendências atreladas ao CNPJ da CONTRATANTE.</p>

                        <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">2. CONSTATAÇÃO DE IRREGULARIDADES E LIMITAÇÃO DE ESCOPO</h3>
                        <p><strong>2.1.</strong> Caso seja constatada qualquer pendência, débito ou irregularidade em nome da CONTRATANTE que impeça a emissão da respectiva certidão de regularidade, a CONTRATADA <strong>não</strong> realizará serviços de despachante, contabilidade, advocacia ou assessoria para a regularização do passivo.</p>
                        <p><strong>2.2.</strong> A obrigação da plataforma nestes cenários limitar-se-á a notificar a CONTRATANTE, por meio dos canais oficiais de comunicação cadastrados no sistema, informando a natureza da irregularidade encontrada e, quando viável, fornecendo um resumo informativo dos passos gerais a serem seguidos pela CONTRATANTE para a regularização perante o órgão competente.</p>

                        <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">3. NECESSIDADE DE OUTORGA DE PROCURAÇÃO</h3>
                        <p><strong>3.1.</strong> A CONTRATANTE declara ciência de que determinados órgãos públicos exigem representação formal para a emissão de certidões específicas ou acesso a sistemas restritos.</p>
                        <p><strong>3.2.</strong> Nesses casos, a plena execução dos serviços de captação documental estará estritamente condicionada à assinatura e entrega (física ou digital) de um <strong>Instrumento de Procuração</strong> outorgando poderes específicos à equipe da CONTRATADA, conforme minuta previamente disponibilizada.</p>

                        <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">4. TRATAMENTO DE DADOS (LGPD)</h3>
                        <p><strong>4.1.</strong> A CONTRATANTE autoriza a CONTRATADA a coletar, armazenar e processar seus dados corporativos (CNPJ, Razão Social, Inscrições, etc.), bem como os <strong>dados pessoais dos seus sócios e administradores legais</strong> (tais como CPF, RG, endereço e estado civil, conforme qualificação no Contrato Social), com a finalidade exclusiva de executar a busca documental, a gestão do cofre digital e a elaboração dos instrumentos de representação necessários.</p>
                        <p><strong>4.2.</strong> O tratamento destes dados dar-se-á em estrita observância à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), garantindo-se o sigilo e a segurança das informações.</p>

                        <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">5. CIÊNCIA PRÉVIA DOS INSTRUMENTOS CONTRATUAIS</h3>
                        <p><strong>5.1.</strong> A CONTRATANTE declara expressamente, neste ato e antes de realizar qualquer pagamento, que teve amplo acesso e efetuou a leitura das minutas do <strong>Contrato Principal de Prestação de Serviços</strong> e do <strong>Instrumento de Procuração</strong>, cujos links foram disponibilizados e acessados nesta mesma página de cadastro.</p>
                        <p><strong>5.2.</strong> A CONTRATANTE reconhece que a liberação do aceite final deste termo foi condicionada tecnicamente pelo sistema à abertura, navegação completa (<em>scroll</em>) e confirmação individualizada de leitura das referidas minutas.</p>
                        <p><strong>5.3.</strong> A conclusão da assinatura da plataforma implica na concordância integral com os termos apresentados, comprometendo-se a CONTRATANTE a formalizar a assinatura definitiva de ambos os documentos no prazo estipulado pela CONTRATADA, sob pena de suspensão imediata dos serviços e ausência de reembolso do valor inicial pago.</p>

                        <div className="py-20 text-center text-slate-300 italic">[ Fim do Documento ]</div>
                    </div>
                </div>
            </div>

            {/* MÓDULO DE CHECKLIST E ACEITE */}
            <div className="w-full max-w-3xl mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700 delay-200">

                {/* Checklist das Minutas */}
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

                {/* Rodapé do Aceite Mestre */}
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

            {/* Botões de Ação */}
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

            {/* MODAL DE LEITURA (SOBREPOSIÇÃO) */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-200 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Header do Modal */}
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

                        {/* Área de Scroll do Modal */}
                        <div onScroll={handleModalScroll} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/50 flex flex-col items-center">

                            {/* Injetamos nossos componentes modulares aqui! */}
                            {activeModal === 'contract' && (
                                <ContractDocument {...documentProps} />
                            )}

                            {activeModal === 'proxy' && (
                                <ProxyDocument {...documentProps} />
                            )}

                            {/* Alerta visual no fim do scroll indicando sucesso */}
                            {((activeModal === 'contract' && hasReadContract) || (activeModal === 'proxy' && hasReadProxy)) && (
                                <div className="mt-8 bg-green-100 text-green-800 px-6 py-3 rounded-full font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
                                    <CheckCircle2 className="h-5 w-5" /> Leitura registrada! Você já pode fechar esta janela.
                                </div>
                            )}
                        </div>

                        {/* Footer do Modal */}
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