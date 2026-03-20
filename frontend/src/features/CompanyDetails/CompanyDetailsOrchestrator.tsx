import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

// Serviços
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';

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
 * documentos, e a lógica de negócio para a aprovação (Compliance) do cliente.
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

    /**
     * Carrega os detalhes da empresa e os seus documentos em paralelo.
     */
    useEffect(() => {
        async function loadData() {
            if (!id) return;
            setLoading(true);
            try {
                const [companyData, docsData] = await Promise.all([
                    companyService.getById(id),
                    documentService.getAll(id)
                ]);

                setCompany(companyData);
                setDocuments(docsData);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar detalhes da empresa.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    /**
     * Atualiza a flag de verificação administrativa (Compliance).
     */
    async function handleApprove() {
        if (!company?.id) return;
        if (!window.confirm("Tem certeza que deseja aprovar esta empresa? Isso liberará o acesso completo ao sistema.")) return;

        setApproving(true);
        try {
            await companyService.update(company.id, {
                is_admin_verified: true
            } as any);

            toast.success("Empresa aprovada com sucesso!");

            // Atualiza o estado local para refletir a mudança instantaneamente na UI
            setCompany((prev: any) => ({ ...prev, is_admin_verified: true }));
        } catch (error) {
            toast.error("Erro ao aprovar empresa.");
        } finally {
            setApproving(false);
        }
    }

    /**
     * Interage com o serviço para efetuar o download de um documento.
     * @param {DocumentDTO} doc - Documento selecionado.
     */
    async function handleDownload(doc: DocumentDTO) {
        try {
            toast.info("Baixando...");
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch (error) {
            toast.error("Erro no download.");
        }
    }

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

            {/* Grelha de Informação Isolada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CompanyInfoCard company={company} />
                <CompanyDocumentsList documents={documents} onDownload={handleDownload} />
            </div>
        </div>
    );
}