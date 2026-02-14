import { useState } from 'react';
import {
    ChevronDown, ChevronRight, FileText, CheckCircle2,
    AlertCircle, History, Download, Scale, Landmark,
    Briefcase, HardHat, FileSignature, FolderOpen, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';
import { categorizeDocuments } from '../../utils/documentCategorizer';
import type { VaultCategory } from '../../utils/documentCategorizer';
interface CompanyVaultProps {
    documents: DocumentDTO[];
}

export function CompanyVault({ documents }: CompanyVaultProps) {
    const data = categorizeDocuments(documents);
    const categories = Object.keys(data) as VaultCategory[];

    return (
        <div className="space-y-4">
            {categories.map((cat) => (
                <VaultSection
                    key={cat}
                    title={cat}
                    validDocs={data[cat].valid}
                    expiredDocs={data[cat].expired}
                />
            ))}
        </div>
    );
}

// --- Sub-componente de Seção ---
function VaultSection({ title, validDocs, expiredDocs }: { title: VaultCategory, validDocs: DocumentDTO[], expiredDocs: DocumentDTO[] }) {
    const [isOpen, setIsOpen] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const hasDocs = validDocs.length > 0 || expiredDocs.length > 0;

    // Ícones para cada categoria
    const getIcon = () => {
        switch (title) {
            case 'Habilitação Jurídica': return <Scale className="text-purple-600" />;
            case 'Regularidade Fiscal e Trabalhista': return <Landmark className="text-blue-600" />;
            case 'Qualificação Econômico-Financeira': return <Briefcase className="text-emerald-600" />;
            case 'Qualificação Técnica': return <HardHat className="text-orange-600" />;
            case 'Declarações': return <FileSignature className="text-slate-600" />;
            default: return <FolderOpen className="text-slate-400" />;
        }
    };

    async function handleDownload(doc: DocumentDTO) {
        try {
            toast.info("Iniciando download...");
            await documentService.downloadDocument(doc.id, doc.filename);
        } catch {
            toast.error("Erro ao baixar documento.");
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Header Clicável */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        {getIcon()}
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">{title}</h3>
                        <p className="text-xs text-slate-500">
                            {validDocs.length} vigentes {expiredDocs.length > 0 && `• ${expiredDocs.length} no histórico`}
                        </p>
                    </div>
                </div>
                {isOpen ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
            </button>

            {/* Corpo da Seção */}
            {isOpen && (
                <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">

                    {!hasDocs && (
                        <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50/30 rounded-lg border border-dashed border-slate-100">
                            Nenhum documento cadastrado nesta categoria.
                        </div>
                    )}

                    {/* Lista de Vigentes */}
                    <div className="space-y-2">
                        {validDocs.map(doc => (
                            <DocRow key={doc.id} doc={doc} onDownload={() => handleDownload(doc)} />
                        ))}
                    </div>

                    {/* Histórico de Vencidos */}
                    {expiredDocs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
                            >
                                <History size={14} />
                                {showHistory ? 'Ocultar Histórico' : `Ver Histórico (${expiredDocs.length} vencidos)`}
                            </button>

                            {showHistory && (
                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {expiredDocs.map(doc => (
                                        <DocRow key={doc.id} doc={doc} isHistory onDownload={() => handleDownload(doc)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Componente de Linha (Documento Individual) ---
function DocRow({ doc, isHistory = false, onDownload }: { doc: DocumentDTO, isHistory?: boolean, onDownload: () => void }) {
    const isWarning = doc.status === 'warning';

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${isHistory
            ? 'border-slate-200 bg-white opacity-75'
            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`${isHistory ? 'text-slate-400' : 'text-blue-600'}`}>
                    <FileText size={20} />
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isHistory ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                        {doc.title || doc.filename}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                        <span title={doc.filename} className="truncate max-w-[200px] text-slate-400 hidden md:block">
                            {doc.filename}
                        </span>
                        {doc.expiration_date ? (
                            <span className={`flex items-center gap-1 font-medium ${isHistory ? 'text-red-400' : isWarning ? 'text-amber-600' : 'text-green-600'
                                }`}>
                                {isHistory ? 'Venceu: ' : 'Vence: '}
                                {format(new Date(doc.expiration_date), 'dd/MM/yyyy')}
                            </span>
                        ) : (
                            <span className="text-slate-400">Validade indeterminada</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 pl-2 shrink-0">
                {/* Badge de Status (Só aparece em telas maiores ou se for importante) */}
                <div className="hidden md:block">
                    {isHistory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={10} /> Vencido
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