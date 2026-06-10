import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, MessageSquareShare } from 'lucide-react';

// Serviços
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../types';

// Componentes UI
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

// Subcomponentes da Feature
import { CompanyHeader } from './components/CompanyHeader';
import { CompanyInfoCard } from './components/CompanyInfoCard';
import { CompanyDocumentsList } from './components/CompanyDocumentsList';

/**
 * Orquestrador dos Detalhes da Empresa.
 * Gere a obtenção do ID da empresa na URL, a busca paralela dos dados e 
 * documentos, e a lógica de negócio para a aprovação (Compliance) do cliente,
 * bem como a gestão de alertas de moderação.
 */
export function CompanyDetailsOrchestrator() {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS DE DADOS ---
    const [company, setCompany] = useState<any>(null);
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);

    // --- ESTADOS DE UI ---
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    // --- ESTADOS DE MODERAÇÃO [US-2905 / US-2907] ---
    const [pendingNotes, setPendingNotes] = useState("");
    const [isSavingModeration, setIsSavingModeration] = useState(false);

    /**
     * Carrega os dados da empresa e os documentos em paralelo.
     */
    useEffect(() => {
        async function loadData() {
            if (!id) return;
            try {
                const [companyData, docsData] = await Promise.all([
                    companyService.getById(id),
                    documentService.getAll(id)
                ]);
                setCompany(companyData);
                setDocuments(docsData);

                // Carrega o estado inicial das pendências
                setPendingNotes(companyData.pending_docs_notes || "");
            } catch (error) {
                toast.error("Erro ao carregar dados do cliente.");
                navigate('/admin/companies');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, navigate]);

    /**
     * Aprova a documentação da empresa (Compliance)
     */
    async function handleApprove() {
        if (!id) return;
        setApproving(true);
        try {
            await companyService.update(id, { is_admin_verified: true });
            setCompany((prev: any) => ({ ...prev, is_admin_verified: true }));
            toast.success("Empresa verificada com sucesso!");
        } catch (error) {
            toast.error("Erro ao aprovar empresa.");
        } finally {
            setApproving(false);
        }
    }

    /**
     * Efetua a transferência de um documento (Mock/Simulação de lógica)
     */
    async function handleDownload(doc: DocumentDTO) {
        const toastId = toast.loading(`Iniciando download de: ${doc.filename}`);
        try {
            // ✅ CHAMADA REAL: Aciona o service que se conecta ao backend e ao Supabase
            await documentService.downloadDocument(doc.id, doc.filename);

            toast.success("Download iniciado!", { id: toastId });
        } catch (error) {
            console.error("Erro ao efetuar download:", error);
            toast.error("Erro ao baixar o arquivo.", { id: toastId });
        }
    }

    /**
     * Salva as pendências e notifica o cliente via Inbox [US-2907]
     */
    async function handleSaveModeration() {
        if (!id) return;
        setIsSavingModeration(true);
        try {
            await companyService.update(id, {
                pending_docs_notes: pendingNotes
            });

            // Dispara alerta automático para Inbox (Lógica de Backend) [US-2907]
            toast.success("Pendências guardadas e cliente notificado!");
        } catch (error) {
            toast.error("Falha ao guardar moderação.");
        } finally {
            setIsSavingModeration(false);
        }
    }

    /**
     * Inserção de alertas rápidos [US-2905]
     */
    const addQuickAlert = (alert: string) => {
        setPendingNotes(prev => prev ? `${prev}\n- ${alert}` : `- ${alert}`);
    };

    // --- RENDERIZAÇÃO CONDICIONAL ---
    if (loading) {
        return <div className="p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
    }

    if (!company) {
        return <div className="p-8 text-center text-slate-500 font-medium">Empresa não encontrada.</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Navegação Rápida */}
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/companies')} className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a Lista
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <span className="text-sm text-slate-400 font-mono">ID: {company.id}</span>
            </div>

            {/* Cabeçalho Isolado */}
            <CompanyHeader
                company={company}
                onApprove={handleApprove}
                approving={approving}
            />

            {/* Grelha de Informação Isolada e Painel de Moderação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CompanyInfoCard company={company} />

                {/* PAINEL DE MODERAÇÃO [US-2905 / US-2907] */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="text-amber-500 h-5 w-5" />
                            Análise de Pendências (Moderação)
                        </h3>
                        <div className="flex flex-wrap justify-end gap-2">
                            {['RG Ilegível', 'CNPJ Desatualizado', 'Falta Assinatura'].map(label => (
                                <button
                                    key={label}
                                    onClick={() => addQuickAlert(label)}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold transition-colors"
                                >
                                    + {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={pendingNotes}
                        onChange={(e) => setPendingNotes(e.target.value)}
                        placeholder="Descreva aqui as pendências para o cliente... (O sistema enviará uma notificação automaticamente)"
                        className="flex-1 min-h-[150px] w-full p-4 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none resize-none bg-slate-50"
                    />

                    <div className="mt-4 flex justify-end shrink-0">
                        <Button
                            onClick={handleSaveModeration}
                            isLoading={isSavingModeration}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <MessageSquareShare className="mr-2 h-4 w-4" /> Guardar e Avisar Cliente
                        </Button>
                    </div>
                </div>
            </div>

            {/* Listagem de documentos abaixo */}
            <CompanyDocumentsList documents={documents} onDownload={handleDownload} />
        </div>
    );
}