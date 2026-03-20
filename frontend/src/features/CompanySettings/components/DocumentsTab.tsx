import { UploadCloud, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

/**
 * Propriedades do componente DocumentsTab.
 * @interface DocumentsTabProps
 */
interface DocumentsTabProps {
    clientDocs: any[];
    isLoadingDocs: boolean;
    handleUploadDoc: (file: File, title: string) => void;
    handleDownloadDoc: (docId: string, filename: string) => void;
    handleDeleteDoc: (docId: string) => void;
}

/**
 * Componente visual para a área de documentos geridos pelo cliente.
 * Permite fazer upload de novos ficheiros e listar/baixar os existentes.
 */
export function DocumentsTab({ clientDocs, isLoadingDocs, handleUploadDoc, handleDownloadDoc, handleDeleteDoc }: DocumentsTabProps) {
    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Bloco de Uploads Obrigatórios */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-blue-600" /> Enviar Novos Documentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <DocUploadCard
                        title="Atos e Procurações"
                        description="Contrato Social, Procuração, Docs Pessoais, etc."
                        onUpload={(f) => handleUploadDoc(f, "Atos Constitutivos")}
                    />
                    <DocUploadCard
                        title="Capacidade Técnica"
                        description="Declarações Manuais, Atestados Técnicos, etc."
                        onUpload={(f) => handleUploadDoc(f, "Declarações e Atestados")}
                    />
                    <DocUploadCard
                        title="Econômico-Financeira"
                        description="Balanço Patrimonial, DRE, etc."
                        onUpload={(f) => handleUploadDoc(f, "Balanço Patrimonial")}
                    />
                    <DocUploadCard
                        title="Outros"
                        description="Demais documentos e anexos."
                        onUpload={(f) => handleUploadDoc(f, "Demais Documentos")}
                    />
                </div>
            </div>

            {/* Lista de Documentos Enviados */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-500" /> Arquivos da Empresa
                    </h3>
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {clientDocs.length} Arquivos
                    </span>
                </div>

                {isLoadingDocs ? (
                    <div className="p-6 space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : clientDocs.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                        <UploadCloud className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>Nenhum documento anexado ainda.</p>
                        <p className="text-sm mt-1">Utilize os atalhos acima para enviar o Contrato Social e o Cartão CNPJ.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {clientDocs.map(doc => (
                            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{doc.title || "Documento"}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 truncate">
                                            <span>{doc.filename}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadDoc(doc.id, doc.filename)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteDoc(doc.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DocUploadCard({ title, description, onUpload }: { title: string, description?: string, onUpload: (f: File) => void }) {
    return (
        <label className="cursor-pointer group">
            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => {
                if (e.target.files?.[0]) {
                    onUpload(e.target.files[0]);
                    e.target.value = '';
                }
            }} />
            <div className="h-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all text-center">
                <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full transition-colors">
                    <UploadCloud size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-slate-700 group-hover:text-blue-700">{title}</h3>
                    {description && (
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{description}</p>
                    )}
                </div>
            </div>
        </label>
    );
}