import { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronRight, FileText, CheckCircle2,
    AlertCircle, Download, FolderOpen, AlertTriangle, Edit, XOctagon, Trash2, Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';

interface CompanyVaultProps {
    documents: DocumentDTO[];
    onEditClick?: (doc: DocumentDTO) => void;
    onDeleteClick?: (doc: DocumentDTO) => void;  // NOVO: Apagar
    onArchiveClick?: (doc: DocumentDTO) => void; // NOVO: Armazenar
}

interface GroupedVault {
    [categoryName: string]: {
        valid: DocumentDTO[];
        archived: DocumentDTO[]; // Alterado de 'expired' para 'archived'
    }
}

export function CompanyVault({ documents, onEditClick, onDeleteClick, onArchiveClick }: CompanyVaultProps) {
    const groupedData = useMemo(() => {
        const groups: GroupedVault = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        documents.forEach(doc => {
            const catName = doc.category_name || 'Outros Documentos';

            if (!groups[catName]) {
                groups[catName] = { valid: [], archived: [] };
            }

            // 🔥 A MÁGICA FOI CORRIGIDA:
            // Agora, a certidão SÓ vai para o armazenamento se o status for explicitamente 'archived'.
            // Se estiver vencida, ela continua na lista 'valid' (principal), mas o DocumentRow 
            // continuará a pintá-la de vermelho para alertar o operador!

            if (doc.status === 'archived') {
                groups[catName].archived.push(doc);
            } else {
                groups[catName].valid.push(doc);
            }
        });

        return groups;
    }, [documents]);

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
                    archivedDocs={groupedData[cat].archived}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onArchiveClick={onArchiveClick}
                />
            ))}
        </div>
    );
}

// --- Sub-componente de Seção ---
function VaultSection({ title, validDocs, archivedDocs, onEditClick, onDeleteClick, onArchiveClick }: any) {
    const [isOpen, setIsOpen] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const hasDocs = validDocs.length > 0 || archivedDocs.length > 0;
    if (!hasDocs) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FolderOpen size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500">{validDocs.length} documentos vigentes</p>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                    {validDocs.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Nenhum documento vigente nesta categoria.</p>
                    ) : (
                        validDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} onEditClick={onEditClick} onDeleteClick={onDeleteClick} onArchiveClick={onArchiveClick} />)
                    )}

                    {archivedDocs.length > 0 && (
                        <div className="pt-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors py-2 font-medium"
                            >
                                <Archive size={16} />
                                {showHistory ? 'Ocultar Armazenados' : `Ver Armazenados / Vencidos (${archivedDocs.length})`}
                            </button>

                            {showHistory && (
                                <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-200">
                                    {archivedDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} isArchived onEditClick={onEditClick} onDeleteClick={onDeleteClick} />)}
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
function DocumentRow({ doc, isArchived = false, onEditClick, onDeleteClick, onArchiveClick }: any) {
    const isWarning = doc.status === 'warning';

    // Verificação em tempo real se já passou da validade
    const isExpiredByDate = doc.expiration_date && new Date(doc.expiration_date) < new Date(new Date().setHours(0, 0, 0, 0));

    const onDownload = async () => {
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch (error) {
            toast.error("Erro ao baixar o arquivo.");
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border bg-white ${isArchived ? 'border-slate-200 opacity-80 bg-slate-50' : 'border-slate-200 shadow-sm'} hover:border-blue-300 transition-colors group`}>
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className={`p-2 rounded-lg shrink-0 ${isArchived ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={20} />
                </div>

                <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isArchived ? 'text-slate-600' : 'text-slate-800'}`}>
                        {doc.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="truncate max-w-[120px] md:max-w-none" title={doc.filename}>{doc.filename}</span>
                        <span>•</span>
                        <span>Enviado: {format(new Date(doc.created_at), 'dd/MM/yyyy')}</span>
                        {doc.expiration_date && (
                            <>
                                <span>•</span>
                                <span className={isWarning && !isArchived ? "text-amber-600 font-medium" : ""}>
                                    Validade: {format(new Date(doc.expiration_date), 'dd/MM/yyyy')}
                                </span>
                            </>
                        )}
                        {doc.is_structured && (
                            <>
                                <span>•</span>
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">INTELIGENTE</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 pl-2 shrink-0">
                <div className="hidden md:block">
                    {doc.status === 'archived' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                            <Archive size={10} /> Armazenado
                        </span>
                    ) : isArchived || isExpiredByDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={10} /> Vencido
                        </span>
                    ) : doc.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 shadow-sm">
                            <XOctagon size={10} /> Erro na Emissão
                        </span>
                    ) : doc.status === 'irregular' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                            <AlertTriangle size={10} /> Irregular
                        </span>
                    ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle size={10} /> Vencendo
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={10} /> Vigente
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {onArchiveClick && !isArchived && (
                        <button onClick={() => onArchiveClick(doc)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Armazenar">
                            <Archive size={18} />
                        </button>
                    )}
                    {onEditClick && (
                        <button onClick={() => onEditClick(doc)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Editar Documento">
                            <Edit size={18} />
                        </button>
                    )}
                    {onDeleteClick && (
                        <button onClick={() => onDeleteClick(doc)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Excluir Definitivamente">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button onClick={onDownload} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Baixar Arquivo">
                        <Download size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}