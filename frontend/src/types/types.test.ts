// src/types/types.test.ts
import { describe, it, expect } from 'vitest';
import {
    type Company,
    type UserProfile,
    type CompanyDocData
} from './index';

/**
 * Este teste valida a consistência do "Contrato de Dados" do LicitaDocs.
 * Garante que as interfaces fundamentais para a geração de documentos
 * permaneçam estáveis.
 */
describe('Contratos de Dados (Interfaces)', () => {

    it('deve garantir que a interface Company possua os campos necessários para o Supabase/Docs', () => {
        // Testamos criando um objeto que DEVE satisfazer a interface
        const mockCompany: Company = {
            id: 'uuid-teste-123',
            cnpj: '00.111.222/0001-33',
            razao_social: 'MINHA EMPRESA LTDA',
            is_active: true,
            created_at: '2026-04-14T10:00:00Z',
            logradouro: 'Rua das Licitações',
            numero: '100',
            bairro: 'Centro',
            cidade: 'Brasília',
            estado: 'DF'
        };

        expect(mockCompany.razao_social).toBe('MINHA EMPRESA LTDA');
        expect(mockCompany.cnpj).toContain('/');
    });

    it('deve garantir que UserProfile tenha os campos de identificação do representante', () => {
        const mockUser: UserProfile = {
            id: 'user-uuid-456',
            email: 'representante@empresa.com.br',
            is_active: true,
            is_email_verified: true,
            role: 'USER',
            nome_completo: 'Matheus Engenheiro',
            cpf: '123.456.789-00'
        };

        expect(mockUser.nome_completo).toBeDefined();
        expect(mockUser.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    it('deve validar o contrato de injeção de dados [US-3004] (CompanyDocData)', () => {
        // Este é o tipo crucial que unifica Empresa + Usuário para os motores de PDF/Word
        const mockDocData: CompanyDocData = {
            razaoSocial: 'LICITADOCS TECNOLOGIA',
            cnpj: '11.222.333/0001-44',
            endereco: 'Av. Brasil, 500',
            cidadeUf: 'Rio de Janeiro/RJ',
            dataAtual: '14 de Abril de 2026',
            nomeRepresentante: 'João Silva',
            cpfRepresentante: '000.000.000-00'
        };

        expect(mockDocData.razaoSocial).toEqual(expect.any(String));
        expect(mockDocData.cidadeUf).toContain('/');
    });
});