import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BRAZILIAN_UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const CONTACT_CHANNELS = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'outro', label: 'Outro' },
] as const;

/**
 * Formata um CNPJ de 14 dígitos para 00.000.000/0000-00.
 */
export function formatCnpj(cnpj: string): string {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) {
        return cnpj;
    }
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone brasileiro (10 ou 11 dígitos) quando possível.
 */
export function formatPhone(phone?: string | null): string {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    if (digits.length === 10) {
        return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
}

/**
 * Formata data ISO para dd/MM/yyyy HH:mm.
 */
export function formatLastContactDate(isoDate?: string | null): string {
    if (!isoDate) return 'Nunca contatado';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return 'Data inválida';
    return format(parsed, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * Formata tempo relativo em português (ex: "há 2 dias").
 */
export function formatRelativeContactTime(isoDate?: string | null): string | null {
    if (!isoDate) return null;
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
}
