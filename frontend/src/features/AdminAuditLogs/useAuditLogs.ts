import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import { AuditLog, AuditLogFilters, PaginatedAuditLogs } from '../../schemas/audit';

export function useAuditLogs(initialFilters: AuditLogFilters = { skip: 0, limit: 100 }) {
    const [data, setData] = useState<PaginatedAuditLogs>({ items: [], total: 0, skip: 0, limit: 100 });
    const [loading, setLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);

    const fetchLogs = useCallback(async (currentFilters: AuditLogFilters) => {
        setLoading(true);
        try {
            const result = await adminService.getAuditLogs(currentFilters);
            setData(result);
        } catch (error: any) {
            console.error("Erro ao buscar logs de auditoria:", error);
            toast.error("Falha ao carregar os logs de auditoria. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch when filters change
    useEffect(() => {
        fetchLogs(filters);
    }, [filters, fetchLogs]);

    const handleFilterChange = (newFilters: Partial<AuditLogFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, skip: 0 })); // Reset pagination on filter change
    };

    const handlePageChange = (newSkip: number) => {
        setFilters(prev => ({ ...prev, skip: newSkip }));
    };

    const handleRefresh = () => {
        fetchLogs(filters);
    };

    return {
        logs: data.items,
        total: data.total,
        loading,
        filters,
        handleFilterChange,
        handlePageChange,
        handleRefresh
    };
}
