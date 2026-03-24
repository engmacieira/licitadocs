import { describe, it, expect } from 'vitest';
import { loginSchema } from './loginSchema';

describe('loginSchema', () => {
    it('should validate a correct login object (Happy Path)', () => {
        const validData = {
            email: 'test@example.com',
            password: 'password123'
        };
        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    describe('email validation', () => {
        it('should fail if email is empty', () => {
            const invalidData = {
                email: '',
                password: 'password123'
            };
            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('O e-mail é obrigatório');
            }
        });

        it('should fail if email format is invalid', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'password123'
            };
            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Formato de e-mail inválido');
            }
        });
    });

    describe('password validation', () => {
        it('should fail if password is empty', () => {
            const invalidData = {
                email: 'test@example.com',
                password: ''
            };
            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('A senha é obrigatória');
            }
        });
    });
});
