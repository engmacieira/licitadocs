// src/features/DocumentTemplates/components/DeclarationSection.tsx
import { useState } from 'react';
import {
    Download,
    AlertTriangle,
    ShieldCheck,
    Lightbulb,
    FileText
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';

// 1. Nosso novo dicionário importado corretamente
import { getTemplateContent } from '../../../lib/templateDictionary';

interface DeclarationSectionProps {
    companyData: CompanyDocData;
}

export function DeclarationSection({ companyData }: DeclarationSectionProps) {
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'docx' | 'pdf' | null>(null);

    // 2. Busca do Dicionário
    const { title: DOC_TITLE, buildBody } = getTemplateContent('declaracoes-unificadas');
    const contentBlocks = buildBody(companyData);

    const handleDownloadDocx = () => {
        setDownloadFormat('docx');
        setIsSafetyModalOpen(true);
    };

    const handleDownloadPdf = () => {
        setDownloadFormat('pdf');
        setIsSafetyModalOpen(true);
    };

    const confirmDocxDownload = () => {
        generateDocx(DOC_TITLE, contentBlocks, companyData, 'Declaracoes_Unificadas_Habilitacao');
        setIsSafetyModalOpen(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Cabeçalho da Seção */}
            <div className="bg-blue-50 border-b border-blue-100 p-6 flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                    <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Declarações Unificadas</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Modelo padrão que atende à maioria das exigências dos editais.
                    </p>
                </div>
            </div>

            {/* Conteúdo Educativo (Expansível) */}
            <div className="p-6 border-b border-slate-100">
                <button
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {isInfoExpanded ? 'Ocultar explicação legal' : 'Por que este documento é necessário?'}
                </button>

                {isInfoExpanded && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed border border-slate-200">
                        <p className="mb-2"><strong>Contexto Legal:</strong> Nos processos licitatórios (Lei 14.133/21 e antigas), as empresas precisam atestar formalmente que cumprem requisitos básicos de integridade e regularidade.</p>
                        <p className="mb-2">Este modelo unifica as declarações obrigatórias para evitar o excesso de papelada, cobrindo:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-2">
                            <li>Não emprego de menores (Art. 7º, XXXIII da CF)</li>
                            <li>Inexistência de fatos impeditivos</li>
                            <li>Ausência de servidores públicos no quadro societário</li>
                            <li>Proposta elaborada de forma independente</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Ações (Download) */}
            <div className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                    onClick={handleDownloadDocx}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm w-full sm:w-auto"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Rascunho (.docx)
                </Button>

                <Button
                    onClick={handleDownloadPdf}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
                >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Gerar Documento Oficial (PDF)
                </Button>
            </div>

            {/* Modal de Alerta Legal */}
            {isSafetyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
                            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-amber-900">Termo de Responsabilidade</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
                                Ao baixar e assinar este documento, o(a) Sr(a). <strong>{companyData.nomeRepresentante}</strong> atesta sob as penas da lei que todas as informações geradas são rigorosamente verdadeiras. Declarações falsas em processos licitatórios constituem crime.
                            </p>

                            <div className="space-y-3">
                                {downloadFormat === 'docx' ? (
                                    <Button onClick={confirmDocxDownload} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Entendi e baixar arquivo (.docx)
                                    </Button>
                                ) : (
                                    <PDFDownloadLink
                                        document={
                                            <PDFTemplate
                                                title={DOC_TITLE}
                                                contentBlocks={contentBlocks}
                                                companyData={companyData}
                                            />
                                        }
                                        fileName="Declaracoes_Unificadas_Habilitacao.pdf"
                                        onClick={() => setIsSafetyModalOpen(false)}
                                        className="block w-full"
                                    >
                                        {({ loading }) => (
                                            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                {loading ? 'Preparando arquivo...' : 'Entendi e baixar arquivo (PDF)'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                )}

                                <button
                                    onClick={() => setIsSafetyModalOpen(false)}
                                    className="w-full text-xs text-slate-500 hover:text-slate-800 font-medium py-2 transition-colors"
                                >
                                    Voltar para a página
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}