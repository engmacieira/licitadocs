import { describe, it, expect } from 'vitest';
import { loginSchema } from './loginSchema';

describe('loginSchema Validation', () => {
    it('deve validar com sucesso quando os dados estiverem corretos', () => {
        const result = loginSchema.safeParse({
            email: 'admin@licitadoc.com',
            password: 'senhaSuperSecreta'
        });

        expect(result.success).toBe(true);
    });

    it('deve falhar se o email estiver vazio ou em formato inválido', () => {
        // Testando formato inválido
        const resultInvalido = loginSchema.safeParse({ email: 'nao-sou-um-email', password: '123' });
        expect(resultInvalido.success).toBe(false);
        if (!resultInvalido.success) {
            expect(resultInvalido.error.issues[0].message).toBe('Formato de e-mail inválido');
        }

        // Testando campo vazio
        const resultVazio = loginSchema.safeParse({ email: '', password: '123' });
        expect(resultVazio.success).toBe(false);
        // O Zod pode retornar o erro do `.email()` ou do `.min()` dependendo da avaliação, 
        // mas falhar é o comportamento esperado!
    });

    it('deve falhar se a senha estiver vazia', () => {
        const result = loginSchema.safeParse({
            email: 'teste@teste.com',
            password: ''
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('A senha é obrigatória');
        }
    });
});