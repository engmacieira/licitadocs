import { X } from 'lucide-react';
import type { AuditLog } from '../../schemas/audit';

interface Props {
    log: AuditLog;
    onClose: () => void;
}

export function AuditLogModal({ log, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Detalhes do Log: <span className="font-mono text-purple-600">{log.id.substring(0, 8)}...</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                            Entity: {log.entity_name} | ID: {log.entity_id} | Action: {log.action}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex flex-col md:flex-row gap-4">
                    {/* Old Payload */}
                    <div className="flex-1 min-w-0 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Old Payload
                        </div>
                        <div className="p-3 overflow-auto flex-1 custom-scrollbar">
                            {log.old_payload ? (
                                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                                    {JSON.stringify(log.old_payload, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center mt-4">Nenhum payload anterior.</p>
                            )}
                        </div>
                    </div>

                    {/* New Payload */}
                    <div className="flex-1 min-w-0 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            New Payload
                        </div>
                        <div className="p-3 overflow-auto flex-1 custom-scrollbar">
                            {log.new_payload ? (
                                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                                    {JSON.stringify(log.new_payload, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center mt-4">Nenhum payload novo.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors text-sm font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
