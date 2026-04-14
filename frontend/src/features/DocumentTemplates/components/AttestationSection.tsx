import { useState } from 'react';
import { FileBadge, Download, AlertTriangle, ShieldCheck, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';

/**
 * Propriedades do componente AttestationSection.
 * @interface AttestationSectionProps
 */
interface AttestationSectionProps {
    companyData: CompanyDocData;
}

const DOC_TITLE = "ATESTADO DE CAPACIDADE TÉCNICA";

/**
 * Componente responsável por renderizar o Atestado de Capacidade Técnica.
 * Inclui um formulário para inserir dinamicamente os dados do cliente
 * que irá validar e assinar o atestado.
 */
export function AttestationSection({ companyData }: AttestationSectionProps) {
    const [clientName, setClientName] = useState("");
    const [clientCnpj, setClientCnpj] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");

    // Estados para UX e Segurança
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'docx' | 'pdf' | null>(null);

    const contentBlocks = [
        `Atesto, para os devidos fins, que a empresa ${companyData.razaoSocial}, inscrita no CNPJ nº ${companyData.cnpj}, realizou o fornecimento de ${serviceDescription || '[ESPECIFICAR SERVIÇOS/MATERIAIS]'} à empresa ${clientName || '[RAZÃO SOCIAL DO CLIENTE]'}, CNPJ nº ${clientCnpj || '[CNPJ DO CLIENTE]'}.`,
        `O fornecimento foi efetuado de forma satisfatória, com a entrega dos materiais/serviços no prazo estabelecido, em perfeito estado e conforme as especificações solicitadas, demonstrando a capacidade técnica, pontualidade e responsabilidade da empresa fornecedora.`,
        `Declaro, portanto, que os produtos/serviços foram devidamente recebidos e que não houve qualquer intercorrência quanto à entrega ou à qualidade do que foi fornecido.`,
        `${companyData.cidadeUf}, ${companyData.dataAtual}.`
    ];

    const triggerSafetyCheck = (format: 'docx' | 'pdf') => {
        setDownloadFormat(format);
        setIsSafetyModalOpen(true);
    };

    const handleConfirmDownload = () => {
        if (downloadFormat === 'docx') {
            generateDocx(DOC_TITLE, contentBlocks, companyData, "Atestado_Capacidade_Tecnica");
            setIsSafetyModalOpen(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <FileBadge size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Atestado de Capacidade Técnica</h2>
                    <p className="text-sm text-slate-500">Comprove sua experiência e vença licitações</p>
                </div>
            </div>

            {/* US-3001: Guia Didático (O "Passaporte") */}
            <div className="mb-6">
                <button
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="flex items-center gap-2 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                    <Lightbulb size={14} />
                    {isInfoExpanded ? "Ocultar dicas de preenchimento" : "Como emitir um atestado vencedor?"}
                    {isInfoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isInfoExpanded && (
                    <div className="mt-3 p-4 bg-amber-50/50 rounded-lg border border-amber-100 text-sm text-slate-600 animate-in slide-in-from-top-2 duration-300">
                        <p className="font-bold text-amber-800 mb-1 text-xs uppercase">Dicas de Especialista:</p>
                        <ul className="space-y-2">
                            <li>• <strong>Seja Específico:</strong> No campo de descrição, detalhe quantidades e modelos. Isso gera autoridade.</li>
                            <li>• <strong>Quem assina:</strong> Este documento deve ser assinado pelo seu <u>cliente</u>, validando seu serviço.</li>
                            <li>• <strong>Importância:</strong> É a prova social exigida para subir de nível e disputar contratos maiores.</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Formulário de Preenchimento */}
            <div className="space-y-4 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dados do seu Cliente (Emissor)</p>
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Empresa Cliente (Razão Social)</label>
                    <input
                        type="text"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Ex: Prefeitura Municipal de Braúnas"
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">CNPJ do Cliente</label>
                        <input
                            type="text"
                            value={clientCnpj}
                            onChange={e => setClientCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Descrição Detalhada do Serviço/Material</label>
                    <textarea
                        value={serviceDescription}
                        onChange={e => setServiceDescription(e.target.value)}
                        placeholder="Ex: Fornecimento e instalação de 20 câmeras IP de alta resolução..."
                        rows={3}
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                </div>
            </div>

            {/* Ações de Download */}
            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                    onClick={() => triggerSafetyCheck('docx')}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all"
                >
                    <Download className="h-4 w-4 mr-2" /> Baixar em Word
                </Button>

                <Button
                    onClick={() => triggerSafetyCheck('pdf')}
                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200"
                >
                    <Download className="h-4 w-4 mr-2" /> Baixar PDF Caprichado
                </Button>
            </div>

            {/* US-3002: Modal de Responsabilidade Legal (Reutilizado) */}
            {isSafetyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertTriangle size={28} />
                            <h3 className="text-lg font-bold">Confirmação de Dados</h3>
                        </div>

                        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                            <p>Você está gerando um atestado para a empresa <strong>{clientName || "Cliente não informado"}</strong>.</p>
                            <p>Certifique-se de que os serviços descritos foram efetivamente prestados. Documentos com informações falsas podem levar à inabilitação da <strong>{companyData.razaoSocial}</strong>.</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            {downloadFormat === 'docx' ? (
                                <Button onClick={handleConfirmDownload} className="w-full bg-slate-800 hover:bg-slate-900">
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Confirmar e Baixar Word
                                </Button>
                            ) : (
                                <PDFDownloadLink
                                    document={<PDFTemplate title={DOC_TITLE} contentBlocks={contentBlocks} customSignatureName={clientName || "[RAZÃO SOCIAL DO CLIENTE]"} />}
                                    fileName="Atestado_Capacidade.pdf"
                                    onClick={() => setIsSafetyModalOpen(false)}
                                >
                                    {({ loading }: { loading: boolean }) => (
                                        <Button className="w-full bg-amber-600 hover:bg-amber-700">
                                            <ShieldCheck className="h-4 w-4 mr-2" /> {loading ? 'Preparando...' : 'Confirmar e Baixar PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}

                            <button onClick={() => setIsSafetyModalOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium py-2">
                                Voltar para revisar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}