import { z } from 'zod';

// Regex simples para CNPJ e CPF (apenas formato, sem algoritmo de dígito verificador por enquanto)
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export const registerSchema = z.object({
    // Dados da Empresa
    cnpj: z.string().regex(cnpjRegex, "CNPJ inválido"),
    legalName: z.string().min(3, "Razão Social é obrigatória"),
    tradeName: z.string().optional(),

    // [NOVOS] Dados do Responsável
    responsibleName: z.string().min(3, "Nome do responsável é obrigatório"),
    cpf: z.string().regex(cpfRegex, "CPF inválido (use apenas números ou formato padrão)"),

    // Dados de Login
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),

}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;