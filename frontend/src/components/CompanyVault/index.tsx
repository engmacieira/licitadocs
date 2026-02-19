import { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronRight, FileText, CheckCircle2,
    AlertCircle, History, Download, FolderOpen, AlertTriangle, Key
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';

interface CompanyVaultProps {
    documents: DocumentDTO[];
}

// Interface para o nosso novo agrupamento dinâmico
interface GroupedVault {
    [categoryName: string]: {
        valid: DocumentDTO[];
        expired: DocumentDTO[];
    }
}

export function CompanyVault({ documents }: CompanyVaultProps) {
    // NOVO: O Agrupamento agora é 100% Dinâmico, baseado na base de dados!
    const groupedData = useMemo(() => {
        const groups: GroupedVault = {};

        documents.forEach(doc => {
            // Se o documento não tem categoria (ex: documento legado), vai para "Outros Documentos"
            const catName = doc.category_name || 'Outros Documentos';

            if (!groups[catName]) {
                groups[catName] = { valid: [], expired: [] };
            }

            // Agrupa por status
            if (doc.status === 'expired') {
                groups[catName].expired.push(doc);
            } else {
                groups[catName].valid.push(doc);
            }
        });

        return groups;
    }, [documents]);

    // Ordenamos as chaves para que a renderização fique consistente
    const categories = Object.keys(groupedData).sort();

    if (documents.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>Nenhum documento encontrado neste cofre.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {categories.map((cat) => (
                <VaultSection
                    key={cat}
                    title={cat}
                    validDocs={groupedData[cat].valid}
                    expiredDocs={groupedData[cat].expired}
                />
            ))}
        </div>
    );
}

// --- Sub-componente de Seção ---
function VaultSection({ title, validDocs, expiredDocs }: { title: string, validDocs: DocumentDTO[], expiredDocs: DocumentDTO[] }) {
    const [isOpen, setIsOpen] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const hasDocs = validDocs.length > 0 || expiredDocs.length > 0;

    if (!hasDocs) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}

                    {/* Ícone Genérico: Como as categorias são dinâmicas, usamos a pasta genérica */}
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FolderOpen size={18} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500">{validDocs.length} documentos vigentes</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                    {validDocs.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Nenhum documento vigente nesta categoria.</p>
                    ) : (
                        validDocs.map(doc => <DocumentRow key={doc.id} doc={doc} />)
                    )}

                    {expiredDocs.length > 0 && (
                        <div className="pt-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors py-2"
                            >
                                <History size={16} />
                                {showHistory ? 'Ocultar Histórico Vencido' : `Ver Histórico (${expiredDocs.length})`}
                            </button>

                            {showHistory && (
                                <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-200">
                                    {expiredDocs.map(doc => <DocumentRow key={doc.id} doc={doc} isHistory />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Sub-componente de Linha (Documento) ---
function DocumentRow({ doc, isHistory = false }: { doc: DocumentDTO, isHistory?: boolean }) {
    const isWarning = doc.status === 'warning';

    const onDownload = async () => {
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border bg-white ${isHistory ? 'border-slate-200 opacity-75 grayscale' : 'border-slate-200 shadow-sm'} hover:border-blue-300 transition-colors group`}>
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className={`p-2 rounded-lg shrink-0 ${isHistory ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={20} />
                </div>

                <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isHistory ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {doc.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="truncate max-w-[120px] md:max-w-none" title={doc.filename}>{doc.filename}</span>
                        <span>•</span>
                        <span>Enviado: {format(new Date(doc.created_at), 'dd/MM/yyyy')}</span>
                        {doc.expiration_date && (
                            <>
                                <span>•</span>
                                <span className={isWarning && !isHistory ? "text-amber-600 font-medium" : ""}>
                                    Validade: {format(new Date(doc.expiration_date), 'dd/MM/yyyy')}
                                </span>
                            </>
                        )}

                        {/* NOVO: Tags visuais do Cofre Inteligente */}
                        {doc.is_structured && (
                            <>
                                <span>•</span>
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                    INTELIGENTE
                                </span>
                            </>
                        )}
                        {doc.authentication_code && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1 text-slate-400" title="Código de Autenticação">
                                    <Key size={12} /> {doc.authentication_code}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 pl-2 shrink-0">
                <div className="hidden md:block">
                    {isHistory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={10} /> Vencido
                        </span>
                    ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle size={10} /> Vencendo
                        </span>
                    ) : doc.status === 'processing' ? ( // Tratamento para o novo status
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <CheckCircle2 size={10} /> Processando
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={10} /> Vigente
                        </span>
                    )}
                </div>

                <button
                    onClick={onDownload}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Baixar Arquivo"
                >
                    <Download size={18} />
                </button>
            </div>
        </div>
    )
}