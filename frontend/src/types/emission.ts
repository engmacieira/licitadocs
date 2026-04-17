export interface EmissionRuleDTO {
    id: string;
    document_type_id: string;
    document_type_name?: string;
    state?: string;
    city?: string;
    emission_link?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    operation_notes?: string;
    created_at: string;
}

export type EmissionRuleCreatePayload = Omit<EmissionRuleDTO, 'id' | 'created_at' | 'document_type_name'>;

export type EmissionRuleUpdatePayload = Partial<EmissionRuleCreatePayload>;
