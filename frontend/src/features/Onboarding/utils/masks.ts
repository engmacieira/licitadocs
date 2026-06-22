// features/Onboarding/utils/masks.ts

/**
 * Aplica a máscara de formatação para o input de CNPJ (00.000.000/0000-00).
 * Limpa qualquer caractere não numérico e estrutura visualmente o documento.
 * * @param value String bruta inserida pelo utilizador
 * @returns String formatada em padrão CNPJ limitada a 18 caracteres
 */
export const formatCnpj = (value: string): string => {
    let cleanValue = value.replace(/\D/g, '');
    cleanValue = cleanValue.replace(/^(\d{2})(\d)/, '$1.$2');
    cleanValue = cleanValue.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    cleanValue = cleanValue.replace(/\.(\d{3})(\d)/, '.$1/$2');
    cleanValue = cleanValue.replace(/(\d{4})(\d)/, '$1-$2');
    return cleanValue.substring(0, 18);
};

/**
 * Aplica a máscara de formatação para o input de CPF (000.000.000-00).
 * Limpa qualquer caractere não numérico e estrutura visualmente o documento.
 * * @param value String bruta inserida pelo utilizador
 * @returns String formatada em padrão CPF limitada a 14 caracteres
 */
export const formatCpf = (value: string): string => {
    let cleanValue = value.replace(/\D/g, '');
    cleanValue = cleanValue.replace(/(\d{3})(\d)/, '$1.$2');
    cleanValue = cleanValue.replace(/(\d{3})(\d)/, '$1.$2');
    cleanValue = cleanValue.replace(/(\d{3})(\d{1,2})/, '$1-$2');
    return cleanValue.substring(0, 14);
};