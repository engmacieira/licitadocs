/**
 * Types and interfaces for the Audit Trail feature.
 */

export interface AuditLog {
    id: string;
    entity_name: string;
    entity_id: string;
    action: string;
    user_id: string | null;
    old_payload: Record<string, any> | null;
    new_payload: Record<string, any> | null;
    created_at: string; // ISO 8601 string
    request_id: string | null;
}

export interface PaginatedAuditLogs {
    items: AuditLog[];
    total: number;
    skip: number;
    limit: number;
}

export interface AuditLogFilters {
    skip?: number;
    limit?: number;
    entity_name?: string;
    entity_id?: string;
    user_id?: string;
    action?: string;
    request_id?: string;
    start_date?: string; // ISO string
    end_date?: string;   // ISO string
}
