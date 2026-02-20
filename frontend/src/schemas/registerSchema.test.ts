import { describe, it, expect } from 'vitest';
import { registerSchema } from './registerSchema';

describe('registerSchema Validation', () => {
    // 🏭 Molde de Dados Válidos para os testes de sucesso
    const validData = {
        cnpj: '12.345.678/0001-90',
        legalName: 'Empresa Teste LTDA',
        tradeName: 'Teste Tech',
        responsibleName: 'João da Silva',
        cpf: '123.456.789-00',
        email: 'USUARIO@EMPRESA.COM', // Em maiúsculas de propósito!
        password: 'senhaSegura123',
        confirmPassword: 'senhaSegura123'
    };

    it('deve validar com sucesso um formulário completo e converter o email', () => {
        const result = registerSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
            // Verifica se o transformador `.toLowerCase()` operou a sua magia no email!
            expect(result.data.email).toBe('usuario@empresa.com');
        }
    });

    it('deve aceitar CNPJ e CPF sem pontuação (apenas números)', () => {
        const data = {
            ...validData,
            cnpj: '12345678000190', // Sem pontos
            cpf: '12345678900'      // Sem pontos
        };
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('deve falhar se os documentos (CNPJ/CPF) forem inválidos', () => {
        // CNPJ muito curto
        const resultCnpj = registerSchema.safeParse({ ...validData, cnpj: '123' });
        expect(resultCnpj.success).toBe(false);
        if (!resultCnpj.success) {
            expect(resultCnpj.error.issues[0].message).toContain('CNPJ inválido');
        }

        // CPF com letras
        const resultCpf = registerSchema.safeParse({ ...validData, cpf: '123.ABC.789-00' });
        expect(resultCpf.success).toBe(false);
        if (!resultCpf.success) {
            expect(resultCpf.error.issues[0].message).toContain('CPF inválido');
        }
    });

    it('deve falhar se as senhas não conferirem (Trigger do Refine)', () => {
        const data = { ...validData, confirmPassword: 'senhaDiferente' };
        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('As senhas não conferem');
            expect(result.error.issues[0].path).toEqual(['confirmPassword']); // O erro tem de estar atrelado ao campo certo
        }
    });

    it('deve validar limites de tamanho (Strings muito curtas)', () => {
        const data = {
            ...validData,
            legalName: 'A', // Mínimo 3
            password: '123', // Mínimo 6
            confirmPassword: '123'
        };
        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
            // Convertendo a lista de erros num array de caminhos para facilitar a validação
            const camposComErro = result.error.issues.map(issue => issue.path[0]);

            expect(camposComErro).toContain('legalName');
            expect(camposComErro).toContain('password');
        }
    });
});