import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Serviços
import { emissionRuleService } from '../../services/emissionRuleService';
import type { EmissionRuleDTO } from '../../services/emissionRuleService';
import { companyService } from '../../services/companyService';
import { emissionRequestService } from '../../services/emissionRequestService';

// Subcomponentes da Feature
import { CompanySelector } from './components/CompanySelector';
import { EmailSection } from './components/EmailSection';
import { WhatsAppSection } from './components/WhatsAppSection';
import { HistorySection } from './components/HistorySection';
import type { RequestHistoryItem } from './components/HistorySection';

/**
 * Orquestrador da Central de Emissão Manual.
 * Gere a montagem dinâmica dos templates de E-mail e WhatsApp baseados 
 * na regra de emissão e na empresa selecionada. Controla também a gravação 
 * e atualização do histórico de solicitações no backend.
 */
export function EmissionOrchestrator() {
    const { ruleId } = useParams<{ ruleId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // --- ESTADOS DE DADOS BASE ---
    const [rule, setRule] = useState<EmissionRuleDTO | null>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || "");
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE CARREGAMENTO E HISTÓRICO ---
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
    const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([]);

    // --- ESTADOS DE TEXTO (TEMPLATES) ---
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [whatsappBody, setWhatsappBody] = useState("");

    /**
     * 1. Carrega a Regra Específica e a lista total de Empresas ao abrir a página.
     */
    useEffect(() => {
        async function loadData() {
            try {
                if (ruleId) {
                    const ruleData = await emissionRuleService.getById(ruleId);
                    setRule(ruleData);
                }
                const companiesData = await companyService.getAll();
                setCompanies(companiesData);
            } catch (error) {
                toast.error("Erro ao carregar dados. Verifique a conexão.");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [ruleId, navigate]);

    /**
     * 2. Carrega o Histórico REAL sempre que a empresa for selecionada ou alterada.
     */
    useEffect(() => {
        if (ruleId && selectedCompanyId) {
            emissionRequestService.getByRuleAndCompany(ruleId, selectedCompanyId)
                .then(data => setRequestHistory(data))
                .catch(() => toast.error("Falha ao carregar o histórico desta empresa."));
        } else {
            setRequestHistory([]);
        }
    }, [ruleId, selectedCompanyId]);

    /**
     * 3. Atualiza os Textos (Templates) dinamicamente injetando os dados da Empresa e da Regra.
     */
    useEffect(() => {
        if (!rule) return;

        const selectedCompany = companies.find(c => c.id === selectedCompanyId);
        const companyName = selectedCompany?.razao_social || selectedCompany?.name || "[NOME DA EMPRESA]";
        const companyCnpj = selectedCompany?.cnpj || "[00.000.000/0000-00]";

        setEmailSubject(`REQUERIMENTO: Emissão de Certidão Negativa de Débitos (CND) - ${companyName} - CNPJ: ${companyCnpj}`);

        setEmailBody(
            `À Secretaria de Fazenda / Setor de Tributação do Município de ${rule.city || '[MUNICÍPIO]'}/${rule.state || '[UF]'},\n\n` +
            `Prezado(a) Servidor(a),\n\n` +
            `Na qualidade de procuradores devidamente constituídos, viemos por meio deste solicitar a emissão da Certidão Negativa de Débitos Municipais (CND), ou Positiva com Efeitos de Negativa (CPEN), em nome da pessoa jurídica ${companyName}, inscrita no CNPJ sob o nº ${companyCnpj}.\n\n` +
            `Informamos que a presente solicitação tem caráter de urgência para fins de habilitação em processos licitatórios, em estrita observância às exigências da Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021).\n\n` +
            `Para a devida instrução deste requerimento e comprovação de legitimidade, encaminhamos em anexo a seguinte documentação:\n\n` +
            `Anexo 01: Comprovante de Inscrição e de Situação Cadastral (Cartão CNPJ);\n` +
            `Anexo 02: Contrato Social (Última alteração consolidada);\n` +
            `Anexo 03: Instrumento de Procuração com poderes específicos para representação perante este órgão;\n` +
            `Anexo 04: Documento de Identificação do Outorgado/Procurador.\n\n` +
            `Solicitamos, por gentileza, a confirmação do recebimento deste e-mail e o envio do número de protocolo gerado, bem como a previsão para a disponibilização do documento.\n\n` +
            `Permanecemos à disposição para eventuais esclarecimentos.\n\n` +
            `Atenciosamente,\n\n` +
            `Equipe de Legalização e Regularidade\n` +
            `Plataforma LicitaDocs`
        );

        setWhatsappBody(
            `Olá, bom dia! Aqui é da equipe de legalização da plataforma LicitaDocs, falando na qualidade de procuradores da empresa ${companyName} (CNPJ: ${companyCnpj}).\n\n` +
            `Enviamos hoje um requerimento para o e-mail do setor solicitando a emissão da CND Municipal da empresa, com o Contrato Social e a nossa Procuração em anexo.\n\n` +
            `Vocês poderiam, por gentileza, confirmar o recebimento do e-mail e nos informar se há um número de protocolo ou uma previsão para a emissão da certidão? Muito obrigado pelo apoio!`
        );
    }, [selectedCompanyId, rule, companies]);

    /**
     * Integração REAL: Registar disparo de e-mail no Banco de Dados.
     */
    const handleSendEmail = async () => {
        if (!ruleId || !selectedCompanyId) {
            toast.error("Por favor, selecione uma empresa antes de disparar o e-mail.");
            return;
        }

        setIsSendingEmail(true);
        try {
            const newRecord = await emissionRequestService.create(ruleId, selectedCompanyId);
            // Adiciona no topo da lista local para atualizar a interface instantaneamente
            setRequestHistory([newRecord, ...requestHistory]);
            toast.success("E-mail registado com sucesso no histórico!", { icon: <CheckCircle2 className="text-green-500" /> });
        } catch (error) {
            toast.error("Erro ao registar disparo no histórico.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    /**
     * Simula o envio de WhatsApp (Dívida técnica).
     */
    const handleSendWhatsApp = () => {
        setIsSendingWhatsApp(true);
        setTimeout(() => {
            setIsSendingWhatsApp(false);
            toast.success("Mensagem de WhatsApp agendada!", { icon: <CheckCircle2 className="text-green-500" /> });
        }, 1500);
    };

    /**
     * Integração REAL: Atualizar a previsão de retorno.
     */
    const updateEstimateDate = async (id: string, dateStr: string) => {
        try {
            await emissionRequestService.update(id, { estimated_date: dateStr });
            setRequestHistory(prev => prev.map(item => item.id === id ? { ...item, estimatedDate: dateStr } : item));
            toast.success("Previsão salva no banco de dados.");
        } catch (error) {
            toast.error("Erro ao salvar previsão.");
        }
    };

    /**
     * Integração REAL: Marcar solicitação como concluída.
     */
    const markAsCompleted = async (id: string) => {
        try {
            await emissionRequestService.update(id, { status: 'completed' });
            setRequestHistory(prev => prev.map(item => item.id === id ? { ...item, status: 'completed' } : item));
            toast.success("Solicitação marcada como concluída!");
        } catch (error) {
            toast.error("Erro ao atualizar status.");
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">A carregar painel de emissão...</div>;
    if (!rule) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in">
            {/* Header / Seletor */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.close()} className="hidden sm:block p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Fechar aba">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Central de Emissão Manual</h1>
                            <p className="text-sm text-slate-500">
                                Prefeitura de <strong className="text-slate-700">{rule.city || 'Município'} - {rule.state || 'UF'}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <CompanySelector
                    companies={companies}
                    selectedCompanyId={selectedCompanyId}
                    setSelectedCompanyId={setSelectedCompanyId}
                    rule={rule}
                />
            </div>

            {/* Painéis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmailSection
                    rule={rule}
                    selectedCompanyId={selectedCompanyId}
                    emailSubject={emailSubject} setEmailSubject={setEmailSubject}
                    emailBody={emailBody} setEmailBody={setEmailBody}
                    handleSendEmail={handleSendEmail} isSendingEmail={isSendingEmail}
                />

                <div className="space-y-6">
                    <WhatsAppSection
                        rule={rule}
                        selectedCompanyId={selectedCompanyId}
                        whatsappBody={whatsappBody} setWhatsappBody={setWhatsappBody}
                        handleSendWhatsApp={handleSendWhatsApp} isSendingWhatsApp={isSendingWhatsApp}
                    />

                    <HistorySection
                        requestHistory={requestHistory}
                        updateEstimateDate={updateEstimateDate}
                        markAsCompleted={markAsCompleted}
                    />
                </div>
            </div>
        </div>
    );
}