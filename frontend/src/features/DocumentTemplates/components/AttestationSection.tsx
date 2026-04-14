import { useState } from 'react';
import {
    FileBadge,
    Download,
    AlertTriangle,
    ShieldCheck,
    Lightbulb,
    Building,
    FileText,
    Hash
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';

/**
 * Propriedades do componente AttestationSection.
 */
interface AttestationSectionProps {
    companyData: CompanyDocData;
}

const DOC_TITLE = "ATESTADO DE CAPACIDADE TÉCNICA";

/**
 * Feature: Atestado de Capacidade Técnica (US-3004)
 * Permite ao usuário gerar um rascunho de atestado para que seu cliente assine.
 * Mantém os modais de segurança e expande a coleta de dados para injeção precisa.
 */
export function AttestationSection({ companyData }: AttestationSectionProps) {
    // Dados do Emissor (O Cliente do nosso usuário)
    const [clientName, setClientName] = useState("");
    const [clientCnpj, setClientCnpj] = useState("");

    // Dados do Objeto (O que foi fornecido/prestado)
    const [serviceType, setServiceType] = useState<'realizou o fornecimento de' | 'prestou os serviços de'>('realizou o fornecimento de');
    const [serviceDescription, setServiceDescription] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");

    // Estados de UI (Mantendo as funções boas existentes)
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'docx' | 'pdf' | null>(null);

    /**
     * Montagem dinâmica dos blocos de conteúdo para injeção nos templates.
     * Segue a regra: "Impressora só salvar, assinar e enviar".
     */
    const contentBlocks = [
        `Atestamos, para os devidos fins de comprovação de capacidade técnica, que a empresa ${companyData.razaoSocial}, inscrita no CNPJ sob o nº ${companyData.cnpj}, com sede em ${companyData.endereco}, ${serviceType} ${serviceDescription || '[DESCREVER PRODUTOS OU SERVIÇOS]'}, conforme registrado na Nota Fiscal nº ${invoiceNumber || '[NÚMERO DA NF]'}.`,
        `O fornecimento acima descrito foi efetuado de forma satisfatória, atendendo plenamente aos prazos, qualidades e especificações técnicas exigidas, nada constando em nossos registros que desabone sua conduta comercial ou capacidade técnica.`,
        `Este atestado é emitido para a empresa ${clientName || '[RAZÃO SOCIAL DO CLIENTE]'}, inscrita no CNPJ nº ${clientCnpj || '[CNPJ DO CLIENTE]'}, servindo como prova de aptidão para fins licitatórios.`,
        `${companyData.cidadeUf}, ${companyData.dataAtual}.`
    ];

    const handleDownloadClick = (format: 'docx' | 'pdf') => {
        setDownloadFormat(format);
        setIsSafetyModalOpen(true);
    };

    const confirmDocxDownload = () => {
        // Chamada corrigida com 4 argumentos conforme docxGenerator.ts
        generateDocx(DOC_TITLE, contentBlocks, companyData, "Atestado_Capacidade_Tecnica");
        setIsSafetyModalOpen(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header da Seção */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg font-bold">
                        <FileBadge size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{DOC_TITLE}</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Atestado de Terceiros</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                    title="O que é este documento?"
                >
                    <Lightbulb size={20} className={isInfoExpanded ? "text-amber-500" : ""} />
                </button>
            </div>

            {/* Conteúdo Didático (US-3001) */}
            {isInfoExpanded && (
                <div className="p-6 bg-amber-50 border-b border-amber-100 animate-in slide-in-from-top duration-300">
                    <div className="flex gap-3 text-amber-800 text-sm leading-relaxed">
                        <div className="mt-1 shrink-0"><Lightbulb size={18} /></div>
                        <div className="space-y-2">
                            <p><strong>Para que serve?</strong> Comprova que sua empresa já executou serviços similares no passado. É o documento mais importante para provar <strong>Capacidade Técnica</strong>.</p>
                            <p><strong>Quem assina?</strong> O seu cliente (quem recebeu o serviço). Você gera este rascunho e envia para ele imprimir e assinar em papel timbrado dele.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulário de Injeção de Dados (US-3004) */}
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                            <Building size={14} /> Razão Social do Cliente (Emissor)
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            placeholder="Ex: Prefeitura Municipal de..."
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                            <Hash size={14} /> CNPJ do Cliente
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            placeholder="00.000.000/0000-00"
                            value={clientCnpj}
                            onChange={(e) => setClientCnpj(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase">Tipo de Atuação</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value as any)}
                        >
                            <option value="realizou o fornecimento de">Fornecimento de Materiais</option>
                            <option value="prestou os serviços de">Prestação de Serviços</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                            <FileText size={14} /> Descrição resumida do objeto
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Ex: gêneros alimentícios, serviços de limpeza, etc."
                            value={serviceDescription}
                            onChange={(e) => setServiceDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2 max-w-xs">
                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                        <Hash size={14} /> Nota Fiscal Nº (Vínculo Jurídico)
                    </label>
                    <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ex: 1234/2024"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                </div>

                {/* Ações de Download */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        onClick={() => handleDownloadClick('pdf')}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200"
                    >
                        <Download className="h-4 w-4 mr-2" /> Gerar PDF
                    </Button>
                    <Button
                        onClick={() => handleDownloadClick('docx')}
                        variant="secondary"
                        className="flex-1 border-2 border-slate-200 hover:bg-slate-50"
                    >
                        <FileText className="h-4 w-4 mr-2 text-blue-600" /> Baixar Word (.docx)
                    </Button>
                </div>
            </div>

            {/* Modal de Segurança (Mantendo a Função Boa de UX) */}
            {isSafetyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Atenção ao Emissor</h3>
                            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                                Este documento é um **rascunho**. Ele só terá validade se for impresso em **papel timbrado do seu cliente** e assinado pelo representante legal **dele**.
                            </p>
                        </div>

                        <div className="mt-8 space-y-3">
                            {downloadFormat === 'docx' ? (
                                <Button onClick={confirmDocxDownload} className="w-full bg-slate-800 hover:bg-slate-900">
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Entendi e baixar Word
                                </Button>
                            ) : (
                                <PDFDownloadLink
                                    document={
                                        <PDFTemplate
                                            title={DOC_TITLE}
                                            contentBlocks={contentBlocks}
                                            companyData={companyData}
                                            isAttestation={true}
                                            customSignatureName={clientName || "[RAZÃO SOCIAL DO CLIENTE]"}
                                        />
                                    }
                                    fileName="Atestado_Capacidade.pdf"
                                    onClick={() => setIsSafetyModalOpen(false)}
                                >
                                    {({ loading }) => (
                                        <Button className="w-full bg-amber-600 hover:bg-amber-700">
                                            <ShieldCheck className="h-4 w-4 mr-2" /> {loading ? 'Preparando...' : 'Entendi e baixar PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}
                            <button onClick={() => setIsSafetyModalOpen(false)} className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors">
                                Voltar para revisar dados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}