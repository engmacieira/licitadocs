/** Perfil completo do utilizador autenticado. */
export interface UserProfile {
    id: string;
    email: string;
    is_active: boolean;
    is_email_verified: boolean;
    role: string;
    nome_completo?: string;
    cpf?: string;
    cargo_profissao?: string;
}

export interface MemberResponse {
    user_id: string;
    name: string | null;
    email: string;
    role: string;
    status: boolean;
    joined_at: string;
}

export interface InvitePayload {
    email: string;
    role: 'MASTER' | 'VIEWER';
}

export interface InviteResponse {
    user_id: string;
    email: string;
    role: string;
    message: string;
}
