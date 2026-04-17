import type { DocumentDTO } from "./document";

export interface AdminStats {
    total_companies: number;
    active_companies: number;
    pending_approval: number;
    documents_generated_month: number;
}

export interface ClientStats {
    company_name: string;
    total_docs: number;
    docs_valid: number;
    docs_expired: number;
    is_contract_signed: boolean;
    is_payment_active: boolean;
    is_admin_verified: boolean;
}

export interface PendingAction {
    company_id: string;
    company_name: string;
    step: 'contract' | 'docs' | 'payment' | 'validation';
    date: string;
    cnpj: string;
}

export interface ChatResponse {
    response: string;
}

export type { DocumentDTO };
