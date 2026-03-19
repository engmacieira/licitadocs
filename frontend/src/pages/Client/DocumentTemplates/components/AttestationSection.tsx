import { useState } from 'react';
import { FileBadge, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';

interface AttestationSectionProps {
    companyData: CompanyDocData;
}

const DOC_TITLE = "ATESTADO DE CAPACIDADE TÉCNICA";

export function AttestationSection({ companyData }: AttestationSectionProps) {
    // Campos para preencher os dados da OUTRA empresa (quem vai assinar o atestado)
    const [clientName, setClientName] = useState("");
    const [clientCnpj, setClientCnpj] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");

    // O texto baseado no seu documento do Word
    const contentBlocks = [
        `Atesto, para os devidos fins, que a empresa ${companyData.razaoSocial}, inscrita no CNPJ nº ${companyData.cnpj}, realizou o fornecimento de ${serviceDescription || '[ESPECIFICAR SERVIÇOS/MATERIAIS]'} à empresa ${clientName || '[RAZÃO SOCIAL DO CLIENTE]'}, CNPJ nº ${clientCnpj || '[CNPJ DO CLIENTE]'}.`,
        `O fornecimento foi efetuado de forma satisfatória, com a entrega dos materiais/serviços no prazo estabelecido, em perfeito estado e conforme as especificações solicitadas, demonstrando a capacidade técnica, pontualidade e responsabilidade da empresa fornecedora.`,
        `Declaro, portanto, que os produtos/serviços foram devidamente recebidos e que não houve qualquer intercorrência quanto à entrega ou à qualidade do que foi fornecido.`,
        `${companyData.cidadeUf}, ${companyData.dataAtual}.`
    ];

    const handleDownloadDocx = () => {
        generateDocx(DOC_TITLE, contentBlocks, companyData, "Atestado_Capacidade_Tecnica");
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <FileBadge size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Atestado de Capacidade Técnica</h2>
                    <p className="text-sm text-slate-500">Modelo para o seu cliente preencher e assinar atestando os seus serviços.</p>
                </div>
            </div>

            {/* Formulário rápido para injetar no documento */}
            <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Dados de quem vai assinar o atestado:</p>
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Empresa Cliente (Razão Social)</label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Prefeitura Municipal de Braúnas" className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">CNPJ do Cliente</label>
                    <input type="text" value={clientCnpj} onChange={e => setClientCnpj(e.target.value)} placeholder="Ex: 00.000.000/0001-00" className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Descrição do Serviço/Material fornecido</label>
                    <textarea value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} placeholder="Ex: materiais para sistemas de segurança eletrônica..." rows={2} className="w-full p-2 text-sm border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-amber-500" />
                </div>
            </div>

            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={handleDownloadDocx} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm">
                    <Download className="h-4 w-4 mr-2" /> Baixar (.docx)
                </Button>

                <PDFDownloadLink
                    document={<PDFTemplate title={DOC_TITLE} contentBlocks={contentBlocks} customSignatureName={clientName || "[RAZÃO SOCIAL DO CLIENTE]"} />}
                    fileName="Atestado_Capacidade.pdf"
                    className="w-full"
                >
                    {({ loading }) => (
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 border-none">
                            <Download className="h-4 w-4 mr-2" /> {loading ? 'A gerar PDF...' : 'Baixar PDF Caprichado'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>
        </div>
    );
}