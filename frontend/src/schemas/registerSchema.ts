import { z } from 'zod';
import { isValidCPF, isValidCNPJ } from '../utils/validators';

/**
 * Dicionário de expressões regulares (Regex) para validação de documentos brasileiros.
 * Configurado para aceitar de forma flexível tanto strings formatadas (com máscara)
 * quanto strings limpas (apenas números).
 */
const PATTERNS = {
    CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
    CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/
};

/**
 * Esquema de validação Zod para o formulário de Registo (Onboarding).
 * Aplica regras estritas de formato para CNPJ/CPF, tamanho mínimo de strings,
 * normalização de e-mail e confirmação de senha.
 */
export const registerSchema = z.object({
    // --- Dados da Empresa ---
    cnpj: z.string()
        .trim()
        .regex(PATTERNS.CNPJ, "Formato de CNPJ inválido")
        .refine((val) => isValidCNPJ(val), "CNPJ matematicamente inválido"),

    legalName: z.string()
        .trim()
        .min(3, "Razão Social deve ter no mínimo 3 caracteres"),

    tradeName: z.string()
        .trim()
        .optional(),

    // --- Dados do Responsável ---
    responsibleName: z.string()
        .trim()
        .min(3, "Nome do responsável deve ter no mínimo 3 caracteres"),

    cpf: z.string()
        .trim()
        .regex(PATTERNS.CPF, "Formato de CPF inválido")
        .refine((val) => isValidCPF(val), "CPF matematicamente inválido"),

    // --- Dados de Autenticação ---
    email: z.string()
        .trim()
        .email("Digite um e-mail válido")
        .toLowerCase(), // UX: E-mail sempre minúsculo para evitar conflitos no backend

    password: z.string()
        .min(6, "A senha deve ter no mínimo 6 caracteres"),

    confirmPassword: z.string(),

}).refine((data) => data.password === data.confirmPassword, {
    // Regra customizada: Valida se as duas senhas coincidem
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

/**
 * Tipo inferido automaticamente a partir do schema de Registo.
 * Utilizado para tipar os payloads de criação de conta e o React Hook Form.
 */
export type RegisterFormData = z.infer<typeof registerSchema>;