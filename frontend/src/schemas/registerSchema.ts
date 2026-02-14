import { z } from 'zod';

// Regex para validação de formato (aceita com ou sem pontuação)
const PATTERNS = {
    CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
    CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/
};

export const registerSchema = z.object({
    // Dados da Empresa
    cnpj: z.string()
        .trim()
        .regex(PATTERNS.CNPJ, "CNPJ inválido (digite apenas números ou use o formato padrão)"),

    legalName: z.string()
        .trim()
        .min(3, "Razão Social deve ter no mínimo 3 caracteres"),

    tradeName: z.string()
        .trim()
        .optional(),

    // Dados do Responsável
    responsibleName: z.string()
        .trim()
        .min(3, "Nome do responsável deve ter no mínimo 3 caracteres"),

    cpf: z.string()
        .trim()
        .regex(PATTERNS.CPF, "CPF inválido (digite apenas números ou use o formato padrão)"),

    // Dados de Login
    email: z.string()
        .trim()
        .email("Digite um e-mail válido")
        .toLowerCase(), // UX: E-mail sempre minúsculo

    password: z.string()
        .min(6, "A senha deve ter no mínimo 6 caracteres"),

    confirmPassword: z.string(),

}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;