import type { Company } from "./company";

export type DocumentScope = "NATIONAL" | "STATE" | "MUNICIPAL";

export interface DocumentAutomationConfigDTO {
    is_automatable: boolean;
    strategy_name?: string | null;
    source_url?: string | null;
    requires_captcha: boolean;
    cron_schedule?: string | null;
    extra_params?: Record<string, any> | null;
}

export interface DocumentTypeDTO {
    id: string;
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    scope: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DocumentCategoryDTO {
    id: string;
    name: string;
    slug: string;
    order: number;
    types: DocumentTypeDTO[];
}

export interface DocumentDTO {
    id: string;
    filename: string;
    title?: string;
    status: string;
    expiration_date?: string;
    created_at: string;
    company_id?: string;
    company_name?: string;
    company_cnpj?: string;
    is_structured: boolean;
    type_id?: string;
    category_id?: string;
    type_name?: string;
    category_name?: string;
    authentication_code?: string;
    is_client_upload?: boolean;
}

export interface DocumentCategoryCreateDTO { name: string; slug: string; order: number; }
export interface DocumentCategoryUpdateDTO { name?: string; slug?: string; order?: number; }

export interface DocumentTypeCreateDTO {
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    category_id: string;
    scope: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DocumentTypeUpdateDTO {
    name?: string; slug?: string; validity_days_default?: number;
    description?: string; category_id?: string; scope?: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DashboardAdminStats {
    total_companies: number;
    total_documents: number;
    total_users: number;
    recent_documents: DocumentDTO[];
    recent_companies: Company[];
}

export interface RequestHistoryItem {
    id: string;
    date: Date;
    companyId: string;
    companyName: string;
    estimatedDate: string;
    status: 'pending' | 'completed';
}
