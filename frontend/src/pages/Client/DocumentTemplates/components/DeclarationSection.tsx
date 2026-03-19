import { FileText, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../../components/ui/Button';
import { type CompanyDocData, generateDocx } from '../utils/docxGenerator';
import { PDFTemplate } from './PDFTemplate';

interface DeclarationSectionProps {
    companyData: CompanyDocData;
}

// O Título Caprichado
const DOC_TITLE = "DECLARAÇÕES UNIFICADAS";

// Textos baseados no seu documento oficial do Word
const contentBlocks = [
    `Eu, [NOME REPRESENTANTE], representante legal da empresa [RAZÃO SOCIAL], inscrita no CNPJ sob o n° [CNPJ], com sede na [ENDEREÇO COMPLETO] em [CIDADE/UF], venho, para os devidos fins, apresentar as seguintes declarações, exigidas para fins de habilitação em processos licitatórios:`,
    `I – Declaração de Veracidade das Informações\nDeclaro que todas as informações prestadas e documentos apresentados são autênticos e verídicos, responsabilizando-me por sua veracidade, sob as penas da lei.`,
    `II – Declaração de Atendimento ao Edital\nDeclaro que li, compreendi e aceito integralmente todas as condições, exigências e obrigações previstas no edital da licitação e em seus anexos.`,
    `III – Declaração de Inexistência de Fatos Impeditivos\nDeclaro, sob as penas da lei, que até a presente data não existem fatos impeditivos à habilitação da empresa para participar de licitações públicas, estando a mesma em situação regular perante os órgãos públicos competentes.`,
    `IV – Declaração de Idoneidade\nDeclaro que a empresa não foi declarada inidônea para licitar ou contratar com a Administração Pública, nem se encontra suspensa ou impedida de participar de licitações.`,
    `V – Declaração de Cumprimento ao Art. 7º, XXXIII, da Constituição Federal\nDeclaro, em cumprimento ao disposto na Lei de Licitações, que a empresa não emprega menor de dezoito anos em trabalho noturno, perigoso ou insalubre e não emprega menor de dezesseis anos, salvo na condição de aprendiz, a partir de quatorze anos.`,
    `VI – Declaração de Inexistência de Vínculo Empregatício ou Parentesco\nDeclaro que nenhum dos sócios, dirigentes ou empregados da empresa possui vínculo empregatício com o órgão licitante, nem parentesco até o terceiro grau com servidores públicos ou autoridades vinculadas ao certame.`,
    `VII – Declaração de Elaboração Independente de Proposta\nDeclaro que a proposta apresentada para este certame foi elaborada de maneira independente, não havendo qualquer tipo de ajuste, acordo ou conluio com outros participantes, visando fraudar o caráter competitivo da licitação.`,
    `VIII – Declaração de Pleno Cumprimento dos Requisitos de Habilitação\nDeclaro que a empresa atende plenamente a todos os requisitos de habilitação exigidos no edital, possuindo a qualificação jurídica, técnica, econômico-financeira e regularidade fiscal e trabalhista necessárias.`,
    `IX – Declaração de Optante pelo Simples Nacional (se aplicável)\nDeclaro, caso a empresa seja optante pelo regime do Simples Nacional, que não há qualquer vedação legal para a fruição dos benefícios previstos na Lei Complementar nº 123/2006.`,
    `X – Declaração de Enquadramento como ME/EPP (se aplicável)\nDeclaro, sob as penas da lei, que a empresa se enquadra na condição de Microempresa (ME) ou Empresa de Pequeno Porte (EPP), cumprindo os requisitos da Lei Complementar nº 123/2006, estando apta a usufruir do tratamento diferenciado e favorecido nas licitações públicas.`,
    `XI – Declaração de Acessibilidade (Pessoa com Deficiência)\nDeclaro, em cumprimento à legislação vigente, que a empresa atende às normas de acessibilidade e reserva de cargos para pessoas com deficiência (PcD) ou reabilitados da Previdência Social, conforme exigido por lei.`,
    `XII – Declaração de Combate ao Trabalho Escravo e Degradante\nDeclaro que a empresa não utiliza, direta ou indiretamente, mão de obra em condições análogas à escravidão ou degradantes, cumprindo rigorosamente a legislação trabalhista e de direitos humanos.`,
    `XIII – Declaração de Compromisso Anticorrupção\nDeclaro que a empresa adota práticas de conformidade e integridade (compliance), comprometendo-se a não praticar atos de corrupção, suborno, fraude ou qualquer conduta ilícita contra a Administração Pública, nacional ou estrangeira, nos termos da Lei nº 12.846/2013 (Lei Anticorrupção).`,
    `XIV – Declaração de Sustentabilidade e Proteção Ambiental\nDeclaro que a empresa adota práticas sustentáveis em suas operações e cumpre toda a legislação ambiental aplicável, não possuindo infrações que a impeçam de firmar contratos com a Administração Pública.`,
    `XV – Declaração de Recebimento de Documentos e Informações\nDeclaro que a empresa recebeu, analisou e compreendeu todos os documentos, anexos e eventuais retificações do edital, não restando dúvidas que impeçam a elaboração da proposta ou a execução do objeto.`,
    `XVI – Declaração de Compromisso de Manutenção das Condições\nDeclaro que, durante toda a execução do contrato, a empresa manterá as mesmas condições de habilitação e qualificação exigidas no certame, comprometendo-se a informar qualquer alteração superveniente à Administração Pública.`,
    `XVII – Declaração de Consentimento para Tratamento de Dados Pessoais (LGPD)\nDeclaro que a empresa está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), autorizando o órgão licitante a tratar os dados pessoais fornecidos exclusivamente para os fins deste certame e eventual contratação.`,
    `XVIII – Declaração de Inexistência de Superveniência de Fatos Impeditivos\nDeclaro que, até a presente data, inexistem fatos supervenientes que afetem a regularidade fiscal, trabalhista ou a qualificação da empresa para a contratação.`,
    `XIX – Declaração de Regularidade Fiscal e Trabalhista\nDeclaro que a empresa encontra-se em situação regular perante as Fazendas Federal, Estadual e Municipal, bem como junto à Seguridade Social (INSS), Fundo de Garantia do Tempo de Serviço (FGTS) e Justiça do Trabalho, comprometendo-se a manter tal regularidade durante toda a vigência do contrato.`,
    `XX – Declaração de Concordância com as Especificações Técnicas\nDeclaro que os produtos e/ou serviços ofertados atendem a todas as especificações técnicas exigidas no edital e seus anexos, responsabilizando-me pelo cumprimento integral do objeto contratado.`,
    `XXI – Declaração de Capacidade de Atendimento\nDeclaro que a empresa possui capacidade técnica, logística e operacional para atender integralmente à demanda objeto do certame, observando prazos, quantidade, qualidade e condições de fornecimento exigidas.`,
    `XXII – Declaração de Compatibilidade dos Preços\nDeclaro que os preços ofertados nesta proposta são compatíveis com os praticados pela empresa em contratações anteriores para objetos de natureza similar, observando os princípios da razoabilidade, economicidade e vantajosidade para a Administração Pública.`,
    `XXIII – Declaração de Conhecimento das Condições Locais e do Objeto\nDeclaro, sob responsabilidade, que tenho pleno conhecimento das condições locais, das exigências técnicas e operacionais e de todas as peculiaridades relacionadas à execução do objeto deste certame, assumindo total responsabilidade por este fato e renunciando a qualquer alegação futura que vise justificar eventuais descumprimentos com base em desconhecimento dessas condições.`,
    `XXIV – Declaração de Cumprimento de Demais Condições Legais e Editais\nDeclaro, para os devidos fins, que a empresa está ciente e em conformidade com todas as demais disposições legais, regulamentares e exigências do edital que sejam aplicáveis, ainda que não expressamente previstas nas declarações acima.`,
    `[CIDADE/UF], [DATA].`
];

// O resto do ficheiro mantém-se igual...

// Auxiliar para preencher placeholders rápido na tela
const replacePlaceholdersOnScreen = (text: string, data: CompanyDocData) => {
    return text
        .replace(/\[RAZÃO SOCIAL\]/g, data.razaoSocial)
        .replace(/\[CNPJ\]/g, data.cnpj)
        .replace(/\[CIDADE\/UF\]/g, data.cidadeUf)
        .replace(/\[DATA\]/g, data.dataAtual)
        .replace(/\[NOME REPRESENTANTE\]/g, data.nomeRepresentante);
};

export function DeclarationSection({ companyData }: DeclarationSectionProps) {

    // Gera o DOCX
    const handleDownloadDocx = () => {
        generateDocx(DOC_TITLE, contentBlocks, companyData, "Declaracoes_Unificadas_Habilitacao");
    };

    // Prepara os textos preenchidos para o PDF Caprichado
    const filledContentBlocks = contentBlocks.map(block => replacePlaceholdersOnScreen(block, companyData));

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Declarações Unificadas</h2>
                    <p className="text-sm text-slate-500">Conjunto de declarações padrão exigidas para habilitação (Lei 14.133/2021).</p>
                </div>
            </div>

            {/* Preview Visual */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 max-h-96 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                <p className="font-bold text-center uppercase mb-4">{DOC_TITLE}</p>
                {filledContentBlocks.map((block, index) => (
                    <p key={index} className="mb-3 text-justify">{block}</p>
                ))}

                <div className="mt-8 text-center border-t border-slate-200 pt-4">
                    <p>__________________________________________________</p>
                    <p className="font-bold">{companyData.razaoSocial}</p>
                    <p>Representante Legal: {companyData.nomeRepresentante}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Botão DOCX */}
                <Button onClick={handleDownloadDocx} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm">
                    <Download className="h-4 w-4 mr-2" /> Baixar em Word (.docx)
                </Button>

                {/* Botão PDF Caprichado usando PDFDownloadLink */}
                <PDFDownloadLink
                    document={<PDFTemplate title={DOC_TITLE} contentBlocks={filledContentBlocks} />}
                    fileName="Declaracoes_Unificadas.pdf"
                    className="w-full"
                >
                    {({ loading }) => (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-2" /> {loading ? 'A gerar PDF...' : 'Baixar PDF Caprichado'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>
        </div>
    );
}