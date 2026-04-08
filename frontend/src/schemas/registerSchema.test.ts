import { describe, it, expect } from 'vitest';
import { registerSchema } from './registerSchema';

describe('registerSchema', () => {
    const validData = {
        cnpj: '11.444.777/0001-61',
        legalName: 'Empresa Teste LTDA',
        tradeName: 'Teste Store',
        responsibleName: 'João da Silva',
        cpf: '529.982.247-25',
        email: 'CONTATO@TESTE.COM',
        password: 'password123',
        confirmPassword: 'password123'
    };

    it('should validate a correct register object (Happy Path)', () => {
        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBe('contato@teste.com'); // Testando a normalização toLowerCase()
        }
    });

    it('should validate with unformatted CNPJ and CPF', () => {
        const unformattedData = {
            ...validData,
            cnpj: '11444777000161',
            cpf: '52998224725'
        };
        const result = registerSchema.safeParse(unformattedData);
        expect(result.success).toBe(true);
    });

    describe('CNPJ validation', () => {
        it('should fail if CNPJ format is invalid', () => {
            const invalidData = { ...validData, cnpj: '12.345.678/0001' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Formato de CNPJ inválido');
            }
        });

        it('should fail if CNPJ is mathematically invalid', () => {
            const invalidData = { ...validData, cnpj: '11.444.777/0001-62' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('CNPJ matematicamente inválido');
            }
        });
    });

    describe('Legal Name validation', () => {
        it('should fail if legalName is too short', () => {
            const invalidData = { ...validData, legalName: 'AB' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Razão Social deve ter no mínimo 3 caracteres');
            }
        });
    });

    describe('Responsible Name validation', () => {
        it('should fail if responsibleName is too short', () => {
            const invalidData = { ...validData, responsibleName: 'Jo' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Nome do responsável deve ter no mínimo 3 caracteres');
            }
        });
    });

    describe('CPF validation', () => {
        it('should fail if CPF format is invalid', () => {
            const invalidData = { ...validData, cpf: '123.456.789' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Formato de CPF inválido');
            }
        });

        it('should fail if CPF is mathematically invalid', () => {
            const invalidData = { ...validData, cpf: '529.982.247-26' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('CPF matematicamente inválido');
            }
        });
    });

    describe('Email validation', () => {
        it('should fail if email format is invalid', () => {
            const invalidData = { ...validData, email: 'not-an-email' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Digite um e-mail válido');
            }
        });
    });

    describe('Password validation', () => {
        it('should fail if password is too short', () => {
            const invalidData = { ...validData, password: '12345', confirmPassword: '12345' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('A senha deve ter no mínimo 6 caracteres');
            }
        });

        it('should fail if passwords do not match', () => {
            const invalidData = { ...validData, confirmPassword: 'differentpassword' };
            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('As senhas não conferem');
                expect(result.error.issues[0].path).toContain('confirmPassword');
            }
        });
    });

    it('should allow optional tradeName to be missing', () => {
        const { tradeName, ...dataWithoutTradeName } = validData;
        const result = registerSchema.safeParse(dataWithoutTradeName);
        expect(result.success).toBe(true);
    });
});
