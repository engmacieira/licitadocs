import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Building2, CheckCircle2, XCircle, FileText,
    Download, ShieldCheck, ArrowLeft, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

// Serviços
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';

// Componentes UI
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

export function AdminCompanyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState<any>(null);
    const [documents, setDocuments] = useState<DocumentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        if (!id) return;
        setLoading(true);
        try {
            // 1. Busca dados da empresa
            const companyData = await companyService.getById(id);
            setCompany(companyData);

            // 2. Busca documentos desta empresa (Passando o ID da empresa para o filtro de Admin)
            const docsData = await documentService.getAll(id);
            setDocuments(docsData);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar detalhes.");
        } finally {
            setLoading(false);
        }
    }

    // Ação: Aprovar Empresa (Compliance)
    async function handleApprove() {
        if (!company?.id) return;

        if (!confirm("Tem certeza que deseja aprovar esta empresa? Isso liberará o acesso completo ao sistema.")) return;

        setApproving(true);
        try {
            // Atualiza apenas a flag de verificação
            await companyService.update(company.id, {
                is_admin_verified: true
            } as any); // Cast 'as any' caso a tipagem do frontend ainda não tenha o campo

            toast.success("Empresa aprovada com sucesso!");
            loadData(); // Recarrega para atualizar a tela
        } catch (error) {
            toast.error("Erro ao aprovar empresa.");
        } finally {
            setApproving(false);
        }
    }

    async function handleDownload(doc: DocumentDTO) {
        try {
            toast.info("Baixando...");
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch (error) {
            toast.error("Erro no download.");
        }
    }

    if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    if (!company) return <div className="p-8">Empresa não encontrada.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header de Navegação */}
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/companies')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <span className="text-sm text-slate-500 font-mono">ID: {company.id}</span>
            </div>

            {/* Cabeçalho da Empresa */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-2xl">
                        {(company.razao_social || company.name)[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{company.razao_social || company.name}</h1>
                        <div className="flex items-center gap-3 text-slate-500 mt-1">
                            <span className="flex items-center gap-1 text-sm"><Building2 size={14} /> {company.cnpj}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-sm">{company.email_corporativo || "Sem e-mail cadastrado"}</span>
                        </div>
                    </div>
                </div>

                {/* Botão de Ação Principal */}
                <div className="flex flex-col items-end gap-2">
                    {company.is_admin_verified ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium">
                            <CheckCircle2 size={20} />
                            Empresa Verificada
                        </div>
                    ) : (
                        <Button
                            onClick={handleApprove}
                            isLoading={approving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <ShieldCheck className="mr-2 h-5 w-5" />
                            Aprovar Documentação
                        </Button>
                    )}
                    <p className="text-xs text-slate-400">
                        Status do Contrato: {company.is_contract_signed ? 'Assinado ✅' : 'Pendente ❌'}
                    </p>
                </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Coluna 1: Dados Cadastrais */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Dados do Cliente</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-slate-500">Nome Fantasia</dt>
                                <dd className="font-medium">{company.nome_fantasia || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Responsável</dt>
                                <dd className="font-medium">{company.responsavel_nome || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Telefone</dt>
                                <dd className="font-medium">{company.telefone || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Endereço</dt>
                                <dd className="font-medium">
                                    {company.logradouro}, {company.numero}<br />
                                    {company.bairro} - {company.cidade}/{company.estado}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Coluna 2 e 3: Documentos (Cofre) */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Arquivos Enviados ({documents.length})
                            </h3>
                            {/* Futuro: Botão de Upload Admin aqui */}
                        </div>

                        {documents.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <p>Nenhum documento encontrado para esta empresa.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {documents.map(doc => (
                                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{doc.title || doc.filename}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span>{doc.filename}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {doc.created_at && format(new Date(doc.created_at), 'dd/MM/yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                            <Download size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}