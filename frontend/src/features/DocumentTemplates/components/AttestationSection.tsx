// src/features/DocumentTemplates/components/AttestationSection.tsx
import { useState } from 'react';
import {
    FileBadge,
    Download,
    AlertTriangle,
    ShieldCheck,
    Building,
    FileText,
    Hash
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';
import { getTemplateContent } from '../../../lib/templateDictionary';

interface AttestationSectionProps {
    companyData: CompanyDocData;
}

export function AttestationSection({ companyData }: AttestationSectionProps) {
    // Estados do Formulário
    const [clientName, setClientName] = useState("");
    const [clientCnpj, setClientCnpj] = useState("");
    const [serviceType, setServiceType] = useState<'realizou o fornecimento de' | 'prestou os serviços de'>('realizou o fornecimento de');
    const [serviceDescription, setServiceDescription] = useState("");

    // Estados de UI
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'docx' | 'pdf' | null>(null);

    // Busca lógica do dicionário
    const { title: DOC_TITLE, buildBody } = getTemplateContent('atestado-capacidade');

    // Gera os parágrafos injetando os dados da empresa + dados digitados do cliente
    const contentBlocks = buildBody(companyData, {
        clientName,
        clientCnpj,
        serviceType,
        serviceDescription
    });

    const handleDownloadDocx = () => {
        setDownloadFormat('docx');
        setIsSafetyModalOpen(true);
    };

    const handleDownloadPdf = () => {
        setDownloadFormat('pdf');
        setIsSafetyModalOpen(true);
    };

    const confirmDocxDownload = () => {
        generateDocx(DOC_TITLE, contentBlocks, companyData, 'Atestado_Capacidade_Tecnica', true);
        setIsSafetyModalOpen(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Cabeçalho */}
            <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-xl">
                    <FileBadge className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Atestado de Capacidade</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Gere o rascunho para que seu cliente assine comprovando sua experiência.
                    </p>
                </div>
            </div>

            {/* Inputs Dinâmicos */}
            <div className="p-6 space-y-4 flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center text-xs font-semibold text-slate-500 uppercase mb-1">
                            <Building className="h-3 w-3 mr-1" /> Razão Social do Cliente
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            placeholder="Ex: Prefeitura Municipal de..."
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="flex items-center text-xs font-semibold text-slate-500 uppercase mb-1">
                            <Hash className="h-3 w-3 mr-1" /> CNPJ do Cliente
                        </label>
                        <input
                            type="text"
                            value={clientCnpj}
                            onChange={e => setClientCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center text-xs font-semibold text-slate-500 uppercase mb-1">
                        <FileText className="h-3 w-3 mr-1" /> Tipo de Atuação
                    </label>
                    <select
                        value={serviceType}
                        onChange={e => setServiceType(e.target.value as any)}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                        <option value="realizou o fornecimento de">Fornecimento de Materiais/Produtos</option>
                        <option value="prestou os serviços de">Prestação de Serviços</option>
                    </select>
                </div>

                <div>
                    <label className="flex items-center text-xs font-semibold text-slate-500 uppercase mb-1 text-justify">
                        Descrição do Objeto
                    </label>
                    <textarea
                        value={serviceDescription}
                        onChange={e => setServiceDescription(e.target.value)}
                        placeholder="Ex: materiais de escritório e papelaria em geral..."
                        rows={2}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Ações */}
            <div className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-end border-t border-slate-100">
                <Button
                    onClick={handleDownloadDocx}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm"
                >
                    <Download className="h-4 w-4 mr-2" /> .docx
                </Button>

                <Button
                    onClick={handleDownloadPdf}
                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                    <ShieldCheck className="h-4 w-4 mr-2" /> Gerar PDF
                </Button>
            </div>

            {/* Modal de Alerta Legal */}
            {isSafetyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 text-center">
                        <div className="bg-amber-50 p-6 flex flex-col items-center border-b border-amber-100">
                            <AlertTriangle className="h-12 w-12 text-amber-600 mb-4" />
                            <h3 className="text-lg font-bold text-amber-900">Atenção ao Emissor</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                Este documento <strong>deve ser assinado pelo seu cliente</strong> (o emissor do atestado). Certifique-se de que os dados acima estão corretos antes de enviar para assinatura.
                            </p>

                            <div className="space-y-3">
                                {downloadFormat === 'docx' ? (
                                    <Button onClick={confirmDocxDownload} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                        Confirmar e baixar (.docx)
                                    </Button>
                                ) : (
                                    <PDFDownloadLink
                                        document={
                                            <PDFTemplate
                                                title={DOC_TITLE}
                                                contentBlocks={contentBlocks}
                                                companyData={companyData}
                                                isAttestation={true}
                                                customSignatureName={clientName || "__________________________"}
                                            />
                                        }
                                        fileName="Atestado_Capacidade_Tecnica.pdf"
                                        onClick={() => setIsSafetyModalOpen(false)}
                                        className="block w-full"
                                    >
                                        {({ loading }) => (
                                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                                                {loading ? 'Preparando...' : 'Confirmar e baixar (PDF)'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                                <button onClick={() => setIsSafetyModalOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
                                    Cancelar e revisar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}