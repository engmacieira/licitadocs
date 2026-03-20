import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { FileSignature } from 'lucide-react';

// Serviços e Contexto
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Subcomponentes da Feature
import { SignatureViewer } from './components/SignatureViewer';
import { SignatureInstructions } from './components/SignatureInstructions';
import { SignatureUpload } from './components/SignatureUpload';

/**
 * Orquestrador da Assinatura Digital.
 * Gere os estados de visualização (Abas), as referências de impressão (React-to-Print),
 * o estado dos ficheiros carregados e a submissão final para a API.
 */
export function SignatureOrchestrator() {
    const navigate = useNavigate();
    const { currentCompany, userProfile } = useAuth();

    // --- REFS DE IMPRESSÃO ---
    const contractRef = useRef<HTMLDivElement>(null);
    const proxyRef = useRef<HTMLDivElement>(null);

    // --- ESTADOS ---
    const [isLoading, setIsLoading] = useState(false);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [proxyFile, setProxyFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'contract' | 'proxy'>('contract');

    const company = currentCompany as any;

    // --- MAPA DE DADOS ---
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

    // --- HOOKS DE IMPRESSÃO ---
    const printContract = useReactToPrint({
        contentRef: contractRef,
        documentTitle: `Contrato_SaaS_${companyData.razaoSocial.replace(/\s+/g, '_')}`,
        onAfterPrint: () => toast.success("Contrato pronto! Agora é só assinar."),
        onPrintError: () => toast.error("Falha ao imprimir o contrato.")
    });

    const printProxy = useReactToPrint({
        contentRef: proxyRef,
        documentTitle: `Procuracao_${companyData.razaoSocial.replace(/\s+/g, '_')}`,
        onAfterPrint: () => toast.success("Procuração pronta! Agora é só assinar."),
        onPrintError: () => toast.error("Falha ao imprimir a procuração.")
    });

    const handlePrint = () => {
        if (activeTab === 'contract') printContract();
        else printProxy();
    };

    // --- SUBMISSÃO À API ---
    const handleComplete = async () => {
        if (!company?.id) return;
        if (!contractFile || !proxyFile) {
            toast.error("Anexe os dois documentos", { description: "Precisamos do contrato e da procuração assinados." });
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Enviando documentos e validando assinatura...");

        try {
            // 1A. Upload do Contrato
            const contractData = new FormData();
            contractData.append("file", contractFile);
            contractData.append("title", "Contrato SaaS Assinado");
            contractData.append("company_id", company.id);
            await api.post("/documents/upload", contractData, { headers: { "Content-Type": "multipart/form-data" } });

            // 1B. Upload da Procuração
            const proxyData = new FormData();
            proxyData.append("file", proxyFile);
            proxyData.append("title", "Procuração Assinada");
            proxyData.append("company_id", company.id);
            await api.post("/documents/upload", proxyData, { headers: { "Content-Type": "multipart/form-data" } });

            // 2. Dispara a flag do Passo 4 (Contrato)
            await api.patch(`/companies/${company.id}/onboarding-step?step=contract`);

            toast.success("Documentos enviados com sucesso!", { id: toastId });
            navigate('/');
        } catch (error) {
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
                {/* Visualização de Documentos */}
                <SignatureViewer
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handlePrint={handlePrint}
                    contractRef={contractRef}
                    proxyRef={proxyRef}
                    companyData={companyData}
                />

                {/* Instruções e Upload */}
                <div className="lg:col-span-1 space-y-6">
                    <SignatureInstructions />

                    <SignatureUpload
                        contractFile={contractFile}
                        setContractFile={setContractFile}
                        proxyFile={proxyFile}
                        setProxyFile={setProxyFile}
                        handleComplete={handleComplete}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}