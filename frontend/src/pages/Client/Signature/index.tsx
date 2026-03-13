import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import {
    FileSignature, Upload, ArrowRight,
    CheckCircle2, AlertTriangle, ExternalLink, X, Printer, FileText, ShieldCheck
} from 'lucide-react'; // <-- ShieldCheck adicionado aqui!

// Serviços e Contexto
import { useAuth } from '../../../contexts/AuthContext';
import { documentService } from '../../../services/documentService';
import api from '../../../services/api';

// Componentes UI
import { Button } from '../../../components/ui/Button';

// Nossos Componentes Modulares (Ajuste o caminho se necessário)
import { ContractDocument } from '../../../components/signature/ContractDocument';
import { ProxyDocument } from '../../../components/signature/ProxyDocument';

export function SignaturePage() {
    const navigate = useNavigate();
    const { currentCompany, userProfile } = useAuth();

    // Refs separados para a impressão de cada documento
    const contractRef = useRef<HTMLDivElement>(null);
    const proxyRef = useRef<HTMLDivElement>(null);

    // Estados da página
    const [isLoading, setIsLoading] = useState(false);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [proxyFile, setProxyFile] = useState<File | null>(null);

    // Estado de UX para controlar a Aba Ativa
    const [activeTab, setActiveTab] = useState<'contract' | 'proxy'>('contract');

    // Dados da Empresa injetados no documento
    const company = currentCompany as any;

    // Objeto consolidado para passar as propriedades (props) para os componentes de forma limpa
    const companyData = {
        razaoSocial: company?.razao_social || "NOME DA EMPRESA",
        cnpj: company?.cnpj || "00.000.000/0000-00",
        endereco: `${company?.logradouro || ''}, ${company?.numero || ''} - ${company?.cidade || ''}/${company?.estado || ''}`,

        cidade: company?.cidade || "Cidade",
        estado: company?.estado || "UF",

        responsavel: userProfile?.nome || company?.responsavel_nome || "NOME DO RESPONSÁVEL",
        cpfResponsavel: userProfile?.cpf || company?.responsavel_cpf || "000.000.000-00",
        genero: userProfile?.genero || "outro",
        rg: userProfile?.rg || "",
        nacionalidade: userProfile?.nacionalidade || "",
        estado_civil: userProfile?.estado_civil || "",
        profissao: userProfile?.profissao || ""
    };

    // 1. Hook de impressão para o Contrato
    const printContract = useReactToPrint({
        contentRef: contractRef,
        documentTitle: `Contrato_SaaS_${companyData.razaoSocial.replace(/\s+/g, '_')}`,
        onAfterPrint: () => toast.success("Contrato pronto! Agora é só assinar."),
        onPrintError: () => toast.error("Falha ao imprimir o contrato.")
    });

    // 2. Hook de impressão para a Procuração
    const printProxy = useReactToPrint({
        contentRef: proxyRef,
        documentTitle: `Procuracao_${companyData.razaoSocial.replace(/\s+/g, '_')}`,
        onAfterPrint: () => toast.success("Procuração pronta! Agora é só assinar."),
        onPrintError: () => toast.error("Falha ao imprimir a procuração.")
    });

    // 3. Função central que o botão vai chamar
    const handlePrint = () => {
        if (activeTab === 'contract') {
            printContract();
        } else {
            printProxy();
        }
    };

    // Função para submeter os arquivos e avançar o Onboarding
    const handleComplete = async () => {
        if (!company?.id) return;
        if (!contractFile || !proxyFile) {
            toast.error("Anexe os dois documentos", { description: "Precisamos do contrato e da procuração assinados." });
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Enviando documentos e validando assinatura...");

        try {
            await documentService.upload(contractFile, "Contrato SaaS Assinado");
            await documentService.upload(proxyFile, "Procuração Assinada");

            await api.patch(`/companies/${company.id}/onboarding-step?step=contract`);

            toast.success("Documentos enviados com sucesso!", { id: toastId });
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar documentos.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (!company) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileSignature className="h-8 w-8 text-blue-600" />
                        Assinatura Digital
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Baixe os documentos, assine gratuitamente no portal Gov.br e anexe-os abaixo.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: Documentos para Baixar */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">

                        {/* HEADER DA ÁREA COM AS ABAS */}
                        <div className="bg-slate-50 border-b border-slate-200">
                            <div className="p-4 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Pré-visualização</h3>
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Salvar {activeTab === 'contract' ? 'Contrato' : 'Procuração'} (PDF)
                                </Button>
                            </div>

                            {/* Navegação das Abas (UI/UX) */}
                            <div className="flex px-4 gap-4">
                                <button
                                    onClick={() => setActiveTab('contract')}
                                    className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'contract'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    Contrato SaaS
                                </button>
                                <button
                                    onClick={() => setActiveTab('proxy')}
                                    className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'proxy'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <FileSignature className="h-4 w-4" />
                                    Procuração
                                </button>
                            </div>
                        </div>

                        {/* ÁREA DO DOCUMENTO (A4 simulado) */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 flex justify-center">
                            <div className={activeTab === 'contract' ? 'block w-full' : 'hidden'}>
                                <ContractDocument ref={contractRef} {...companyData} />
                            </div>

                            <div className={activeTab === 'proxy' ? 'block w-full' : 'hidden'}>
                                <ProxyDocument ref={proxyRef} {...companyData} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: Instruções e Upload */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Passo a Passo */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Como Assinar?
                        </h3>
                        <ol className="space-y-4 text-sm text-blue-800">
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">1</span>
                                <span>Navegue pelas abas ao lado e clique em "Salvar (PDF)" para baixar os dois documentos.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">2</span>
                                <div>
                                    Acesse o portal do Governo:
                                    <a href="https://assinador.iti.br/assinatura/index.xhtml" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-blue-600 hover:underline mt-1">
                                        gov.br/assinatura <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">3</span>
                                <span>Faça o login, anexe os PDFs, assine digitalmente e baixe os arquivos assinados.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">4</span>
                                <span>Faça o upload dos arquivos assinados logo abaixo.</span>
                            </li>
                        </ol>

                        {/* UX Legal: Bloco informativo sobre a validade STJ */}
                        <div className="mt-5 p-3.5 bg-white/60 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
                            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                            <p>
                                <strong>Dispensa de Cartório:</strong> A assinatura eletrônica avançada (Gov.br) possui validade legal plena e <strong>dispensa o reconhecimento de firma</strong>, conforme entendimento consolidado pelo STJ (REsp nº 2.243.445).
                            </p>
                        </div>
                    </div>

                    {/* Zonas de Upload */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                        <h3 className="font-bold text-slate-900 border-b pb-2">Anexar Documentos Assinados</h3>

                        <FileUploadZone
                            id="contract-upload"
                            label="Contrato SaaS Assinado"
                            file={contractFile}
                            setFile={setContractFile}
                        />

                        <FileUploadZone
                            id="proxy-upload"
                            label="Procuração Assinada"
                            file={proxyFile}
                            setFile={setProxyFile}
                        />

                        <Button
                            className="w-full mt-4"
                            size="lg"
                            onClick={handleComplete}
                            disabled={!contractFile || !proxyFile}
                            isLoading={isLoading}
                        >
                            Finalizar e Enviar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Sub-componente para a zona de drag and drop / upload mantido no mesmo arquivo por conveniência
function FileUploadZone({ id, label, file, setFile }: any) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">{label}</label>
            <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file ? 'border-green-200 bg-green-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}>
                <input
                    type="file"
                    id={id}
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-green-800 truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-green-100 rounded text-green-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-3">
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 text-center">Clique para procurar o PDF assinado</span>
                    </label>
                )}
            </div>
        </div>
    );
}