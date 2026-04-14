// src/utils/templateDictionary.spec.ts
import { describe, it, expect } from 'vitest';
import { getTemplateContent } from './templateDictionary';
import { type CompanyDocData } from '../types';

describe('templateDictionary - Lógica de Conteúdo (US-3004)', () => {

    const mockData: CompanyDocData = {
        razaoSocial: 'MINHA EMPRESA LTDA',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua das Flores, 100',
        cidadeUf: 'Sinfonia/JS',
        dataAtual: '14 de Abril de 2026',
        nomeRepresentante: 'João Silva',
        cpfRepresentante: '123.456.789-00'
    };

    it('deve retornar o template de Declarações Unificadas com os dados injetados', () => {
        const { title, buildBody } = getTemplateContent('declaracoes-unificadas');
        const paragraphs = buildBody(mockData);

        expect(title).toBe('DECLARAÇÕES UNIFICADAS');
        // Valida se o primeiro parágrafo contém os dados principais
        expect(paragraphs[0]).toContain('João Silva');
        expect(paragraphs[0]).toContain('MINHA EMPRESA LTDA');
        expect(paragraphs[0]).toContain('12.345.678/0001-90');
    });

    it('deve processar corretamente os dados extras no Atestado de Capacidade', () => {
        const { title, buildBody } = getTemplateContent('atestado-capacidade');

        const extraData = {
            clientName: 'PREFEITURA DE TESTE',
            clientCnpj: '99.888.777/0001-66',
            serviceType: 'prestou os serviços de',
            serviceDescription: 'manutenção de redes'
        };

        const paragraphs = buildBody(mockData, extraData);

        expect(title).toBe('ATESTADO DE CAPACIDADE TÉCNICA');
        // Valida se os dados do cliente (extra) foram injetados
        expect(paragraphs[0]).toContain('PREFEITURA DE TESTE');
        expect(paragraphs[0]).toContain('99.888.777/0001-66');
        expect(paragraphs[0]).toContain('manutenção de redes');
        // Valida se os dados da nossa empresa também estão lá
        expect(paragraphs[0]).toContain('MINHA EMPRESA LTDA');
    });

    it('deve aplicar fallbacks (texto padrão) no atestado quando o usuário deixar campos vazios', () => {
        const { buildBody } = getTemplateContent('atestado-capacidade');
        const paragraphs = buildBody(mockData, {}); // Dados extras vazios

        // Corrigido para bater exatamente com o dicionário
        expect(paragraphs[0]).toContain('[RAZÃO SOCIAL DO CLIENTE]');
        expect(paragraphs[0]).toContain('[CNPJ DO CLIENTE]');
        expect(paragraphs[0]).toContain('[ESPECIFICAR SERVIÇOS/MATERIAIS]');
        expect(paragraphs[0]).toContain('realizou o fornecimento de');
    });

    it('deve retornar erro amigável (fallback) para um ID de template inexistente', () => {
        const { title, buildBody } = getTemplateContent('template-que-nao-existe');
        const paragraphs = buildBody(mockData);

        expect(title).toBe('DOCUMENTO NÃO ENCONTRADO');
        expect(paragraphs[0]).toContain('não foi encontrado');
    });
});