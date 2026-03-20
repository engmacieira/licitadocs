import { useMemo } from 'react';
import { ShieldAlert, Building2, FileText, XOctagon, AlertTriangle } from 'lucide-react';
import type { DocumentDTO } from '../../../services/documentService';

/**
 * Propriedades do componente IrregularMonitor.
 * @interface IrregularMonitorProps
 */
interface IrregularMonitorProps {
    /** Lista bruta de documentos irregulares vindos do backend. */
    documents: DocumentDTO[];
    /** Termo de pesquisa para filtrar os documentos localmente. */
    searchTerm: string;
}

/**
 * Componente responsável por monitorizar e exibir os documentos com problemas.
 * O seu grande diferencial é a lógica de agrupamento (useMemo) que organiza
 * as pendências por empresa, facilitando a visualização e gestão por parte
 * do administrador.
 */
export function IrregularMonitor({ documents, searchTerm }: IrregularMonitorProps) {
    // Agrupa os documentos irregulares por Empresa e aplica o filtro de busca de forma otimizada
    const groupedIrregular = useMemo(() => {
        const groups: Record<string, { companyName: string, cnpj: string, docs: DocumentDTO[] }> = {};

        documents.forEach(doc => {
            const compId = doc.company_id || 'unknown';
            if (!groups[compId]) {
                groups[compId] = {
                    companyName: doc.company_name || 'Empresa Desconhecida',
                    cnpj: doc.company_cnpj || '',
                    docs: []
                };
            }

            // Filtro de pesquisa (Nome da Empresa ou Título do Documento)
            const searchLower = searchTerm.toLowerCase();
            if (doc.company_name?.toLowerCase().includes(searchLower) || doc.title?.toLowerCase().includes(searchLower)) {
                groups[compId].docs.push(doc);
            }
        });

        // Limpa empresas que ficaram sem documentos após a aplicação do filtro
        Object.keys(groups).forEach(key => {
            if (groups[key].docs.length === 0) delete groups[key];
        });

        return groups;
    }, [documents, searchTerm]);

    if (Object.keys(groupedIrregular).length === 0) {
        return (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <ShieldAlert className="mx-auto h-12 w-12 text-green-300 mb-4" />
                <p className="text-lg font-medium text-slate-700">Tudo em conformidade!</p>
                <p className="text-sm">Nenhuma empresa apresenta documentos irregulares ou com erro no momento.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            {Object.values(groupedIrregular).map((group, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Header da Empresa */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm mt-0.5">
                            <Building2 className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{group.companyName}</h3>
                            <p className="text-xs text-slate-500">CNPJ: {group.cnpj}</p>
                        </div>
                        <div className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">
                            {group.docs.length} Pendência{group.docs.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Lista de Documentos Problemáticos */}
                    <div className="divide-y divide-slate-100 p-2">
                        {group.docs.map(doc => (
                            <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors group/item">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                    <p className="text-sm font-medium text-slate-700 truncate" title={doc.title || doc.filename}>
                                        {doc.title || doc.filename}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {doc.status === 'error' ? (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                                            <XOctagon size={12} /> Erro Emissão
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                            <AlertTriangle size={12} /> Irregular
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}