import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Building2, Calendar, FileText, UploadCloud, Download, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { toast } from 'sonner';

// Definindo a interface localmente para os documentos, caso não esteja exportada no service
interface CompanyDocument {
    id: string;
    filename: string;
    created_at: string;
    status: string;
}

export function CompanyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados Principais
    const [company, setCompany] = useState<Company | null>(null);
    const [documents, setDocuments] = useState<CompanyDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');

    // Ref para o input de arquivo invisível
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Carrega dados da empresa ao abrir a tela
    useEffect(() => {
        if (id) loadCompany(id);
    }, [id]);

    // 2. Carrega documentos quando a aba muda para 'documents'
    useEffect(() => {
        if (id && activeTab === 'documents') {
            loadDocuments(id);
        }
    }, [id, activeTab]);

    async function loadCompany(companyId: string) {
        try {
            const data = await companyService.getById(companyId);
            setCompany(data);
        } catch (error) {
            toast.error("Erro ao carregar empresa.");
            navigate('/admin/companies');
        } finally {
            setLoading(false);
        }
    }

    async function loadDocuments(companyId: string) {
        try {
            // O cast 'as any' garante compatibilidade se o tipo do service divergir levemente
            const docs = await companyService.getDocuments(companyId);
            setDocuments(docs as any);
        } catch (error) {
            console.error("Erro ao buscar documentos:", error);
            // Não exibimos toast de erro aqui para não poluir se for apenas lista vazia
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0 || !company) return;

        const file = files[0];
        const toastId = toast.loading("Enviando arquivo...");

        try {
            await companyService.uploadDocument(company.id, file);

            toast.dismiss(toastId);
            toast.success("Upload concluído com sucesso!");

            // Recarrega a lista imediatamente
            loadDocuments(company.id);

        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Falha ao fazer upload do arquivo.");
        } finally {
            // Reseta o input para permitir enviar o mesmo arquivo novamente se necessário
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    async function handleDownload(doc: CompanyDocument) {
        if (!company) return;
        try {
            await companyService.downloadDocument(company.id, doc.id, doc.filename);
            toast.success("Download iniciado!");
        } catch (error) {
            toast.error("Erro ao baixar arquivo.");
        }
    }

    async function handleDeleteDoc(doc: CompanyDocument) {
        if (!company) return;
        if (!window.confirm(`Excluir o arquivo "${doc.filename}"?`)) return;

        try {
            await companyService.deleteDocument(company.id, doc.id);
            toast.success("Documento removido.");
            loadDocuments(company.id); // Atualiza a lista
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    }

    if (loading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
    if (!company) return null;

    return (
        <div className="p-8 space-y-6">
            {/* Header com Navegação */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/admin/companies')}>
                    <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{company.razao_social || company.name}</h1>
                    <div className="flex items-center text-slate-500 text-sm gap-4 mt-1">
                        <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {company.cnpj}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Cadastrado em {new Date(company.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {company.is_active ? 'Ativo' : 'Bloqueado'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Abas de Navegação Interna */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Documentos
                    </button>
                </nav>
            </div>

            {/* Conteúdo das Abas */}
            <div className="mt-6">
                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-2">Dados Cadastrais</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-slate-500 text-xs">Razão Social</span>
                                    <span className="text-slate-700">{company.razao_social}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">CNPJ</span>
                                    <span className="font-mono text-slate-700">{company.cnpj}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs">ID do Sistema</span>
                                    <span className="font-mono text-slate-400 text-xs">{company.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Área de Upload */}
                        <div
                            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center pointer-events-none">
                                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Upload de Documentos</h3>
                                <p className="text-slate-500 max-w-sm mt-1 mb-4">
                                    Arraste arquivos aqui ou clique para enviar documentos diretamente para a empresa <strong>{company.name}</strong>.
                                </p>
                                <Button>
                                    Selecionar Arquivo
                                </Button>
                            </div>
                            {/* Input Invisível */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.jpg,.png" // Opcional: restringir tipos
                            />
                        </div>

                        {/* Lista de Documentos */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 font-medium text-slate-700 flex justify-between items-center">
                                <span>Arquivos Armazenados</span>
                                <span className="text-xs font-normal text-slate-500">{documents.length} arquivo(s)</span>
                            </div>

                            {documents.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                    <FileText className="h-10 w-10 mb-3 opacity-20" />
                                    <p>Nenhum documento enviado ainda.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {documents.map((doc) => (
                                        <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Enviado em {new Date(doc.created_at).toLocaleDateString()} às {new Date(doc.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Botão Download */}
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Baixar"
                                                >
                                                    <Download size={18} />
                                                </button>

                                                {/* Botão Excluir */}
                                                <button
                                                    onClick={() => handleDeleteDoc(doc)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}