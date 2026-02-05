import { z } from 'zod';

// Validação básica de formato de CNPJ (pode ser melhorada depois com algoritmo real)
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;

export const registerSchema = z.object({
    // Dados da Empresa
    cnpj: z.string().regex(cnpjRegex, "CNPJ inválido (use apenas números ou formato padrão)"),
    legalName: z.string().min(3, "Razão Social é obrigatória"),
    tradeName: z.string().optional(), // Nome Fantasia

    // Dados do Admin
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),

    // Arquivos (Validaremos a presença manualmente no componente, pois Zod + FileList é chato)
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;