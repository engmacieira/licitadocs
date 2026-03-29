import React, { useState } from 'react';
import { useAuditLogs } from './useAuditLogs';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogModal } from './AuditLogModal';
import { AuditLog } from '../../schemas/audit';
import { Activity } from 'lucide-react';

export function AdminAuditLogs() {
    const {
        logs,
        total,
        loading,
        filters,
        handleFilterChange,
        handlePageChange,
        handleRefresh
    } = useAuditLogs();

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const handleResetFilters = () => {
        handleFilterChange({
            entity_name: undefined,
            entity_id: undefined,
            user_id: undefined,
            action: undefined,
            start_date: undefined,
            end_date: undefined,
            request_id: undefined,
            skip: 0,
            limit: 100
        });
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Trilha de Auditoria</h1>
                        <p className="text-sm text-slate-500 mt-1">Visualize as ações e modificações em todo o sistema (Audit Trail).</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm shadow-sm"
                    >
                        Atualizar
                    </button>
                </div>
            </header>

            <AuditLogFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />

            <AuditLogTable
                logs={logs}
                loading={loading}
                onViewDetails={setSelectedLog}
            />

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-sm text-slate-600 font-medium">
                <span>Mostrando {logs.length} resultados de {total}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(Math.max(0, (filters.skip || 0) - (filters.limit || 100)))}
                        disabled={(filters.skip || 0) === 0}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => handlePageChange((filters.skip || 0) + (filters.limit || 100))}
                        disabled={(filters.skip || 0) + (filters.limit || 100) >= total}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {selectedLog && (
                <AuditLogModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
}
