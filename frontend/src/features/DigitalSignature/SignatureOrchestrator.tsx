import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { FileSignature, RefreshCw } from 'lucide-react';

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
    const [isSyncing, setIsSyncing] = useState(true); // US-2707: Estado de sincronização
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [proxyFile, setProxyFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'contract' | 'proxy'>('contract');

    // ESTADOS LOCAIS PARA SINCRONIZAÇÃO (US-2707)
    const [company, setCompany] = useState<any>(currentCompany);
    const [user, setUser] = useState<any>(userProfile);

    // --- FORÇAR REFRESH DOS DADOS AO ENTRAR ---
    useEffect(() => {
        async function fetchFreshData() {
            if (!currentCompany?.id) return;
            setIsSyncing(true);
            try {
                // Busca os dados atualizados direto da API para preencher os PDFs
                const [freshCompany, freshUser] = await Promise.all([
                    api.get(`/companies/${currentCompany.id}`).then(res => res.data),
                    api.get('/users/me').then(res => res.data)
                ]);
                setCompany(freshCompany);
                setUser(freshUser);
            } catch (error) {
                console.error("Erro ao sincronizar dados", error);
                toast.error("Usando dados em cache. Algumas informações podem estar desatualizadas.");
            } finally {
                setIsSyncing(false);
            }
        }
        fetchFreshData();
    }, [currentCompany]);

    // --- MAPA DE DADOS ---
    const companyData = {
        razaoSocial: company?.razao_social || "NOME DA EMPRESA",
        cnpj: company?.cnpj || "00.000.000/0000-00",
        endereco: `${company?.logradouro || ''}, ${company?.numero || ''} - ${company?.cidade || ''}/${company?.estado || ''}`,
        cidade: company?.cidade || "Cidade",
        estado: company?.estado || "UF",
        responsavel: user?.nome || company?.responsavel_nome || "NOME DO RESPONSÁVEL",
        cpfResponsavel: user?.cpf || company?.responsavel_cpf || "000.000.000-00",
        genero: user?.genero || "outro",
        rg: user?.rg || "",
        nacionalidade: user?.nacionalidade || "",
        estado_civil: user?.estado_civil || "",
        profissao: user?.profissao || ""
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
            // 1A. Upload do Contrato (US-2708: Correção do Bug de Logout)
            const contractData = new FormData();
            contractData.append("file", contractFile);
            contractData.append("title", "Contrato SaaS Assinado");
            contractData.append("company_id", company.id);
            contractData.append("is_client_upload", "true"); // <-- ESSENCIAL PARA NÃO DAR 401

            // Removi os headers manuais pois o Axios injeta o multipart/boundary automaticamente
            await api.post("/documents/upload", contractData);

            // 1B. Upload da Procuração (US-2708: Correção do Bug de Logout)
            const proxyData = new FormData();
            proxyData.append("file", proxyFile);
            proxyData.append("title", "Procuração Assinada");
            proxyData.append("company_id", company.id);
            proxyData.append("is_client_upload", "true"); // <-- ESSENCIAL PARA NÃO DAR 401

            await api.post("/documents/upload", proxyData);

            // 2. Dispara a flag do Passo 4 (Contrato)
            await api.patch(`/companies/${company.id}/onboarding-step?step=contract`);

            toast.success("Documentos enviados com sucesso!", { id: toastId });
            navigate('/');
        } catch (error) {
            console.error("Erro no upload", error);
            toast.error("Erro ao processar documentos.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (!company) return null;

    // Feedback visual enquanto sincroniza os dados
    if (isSyncing) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500 animate-in fade-in">
                <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mb-4" />
                <p className="font-medium text-slate-700">Sincronizando dados jurídicos...</p>
                <p className="text-sm mt-1">Isso garante que o contrato saia com seu endereço atualizado.</p>
            </div>
        );
    }

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