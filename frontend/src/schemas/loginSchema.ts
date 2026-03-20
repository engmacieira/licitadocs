import { z } from 'zod';

/**
 * Esquema de validação Zod para o formulário de Login.
 * Garante que o e-mail tem um formato válido e que a senha não está vazia
 * antes de permitir a submissão para a API.
 */
export const loginSchema = z.object({
    email: z.string()
        .min(1, 'O e-mail é obrigatório')
        .email('Formato de e-mail inválido'),
    password: z.string()
        .min(1, 'A senha é obrigatória')
});

/**
 * Tipo inferido automaticamente a partir do schema de Login.
 * Utilizado para tipar de forma estrita o React Hook Form.
 */
export type LoginFormData = z.infer<typeof loginSchema>;