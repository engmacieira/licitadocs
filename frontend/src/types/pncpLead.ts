export type PncpLeadContactStatus = 'all' | 'ready' | 'cooldown' | 'never_contacted';

export interface PncpLeadResponse {
    id: string;
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string | null;
    email?: string | null;
    telefone?: string | null;
    uf?: string | null;
    municipio?: string | null;
    porte?: string | null;
    origem_pncp?: string | null;

    last_contacted_at?: string | null;
    contact_count: number;
    last_contact_channel?: string | null;
    last_contact_notes?: string | null;
    spam_cooldown_days: number;

    created_at?: string | null;
    updated_at?: string | null;

    is_in_cooldown: boolean;
    cooldown_remaining_days: number;
}

export interface PncpLeadContactRequest {
    channel: string;
    notes?: string | null;
    cooldown_days?: number | null;
}

export interface PncpLeadContactResponse {
    lead: PncpLeadResponse;
    was_in_cooldown: boolean;
    warning_message?: string | null;
}

export interface PncpLeadStats {
    total: number;
    ready_for_contact: number;
    in_cooldown: number;
}

export interface PncpLeadListResponse {
    items: PncpLeadResponse[];
    total: number;
    skip: number;
    limit: number;
    stats: PncpLeadStats;
}

export interface PncpLeadSyncRequest {
    uf?: string | null;
    dias_retroativos?: number;
    codigo_modalidade?: number;
    max_paginas?: number;
    tamanho_pagina?: number;
}

export interface PncpLeadSyncResponse {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
}

export interface PncpLeadListParams {
    search?: string;
    uf?: string;
    contact_status?: PncpLeadContactStatus;
    cooldown_days?: number;
    skip?: number;
    limit?: number;
}
