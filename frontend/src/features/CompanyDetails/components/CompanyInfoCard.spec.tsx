import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompanyInfoCard } from './CompanyInfoCard';

// 1. Mock de uma empresa com TODOS os dados preenchidos
const mockCompanyFull = {
    nome_fantasia: 'Tech Solutions',
    ie: '123.456.789.000',
    im: '98765-4',
    responsavel_nome: 'Carlos Eduardo',
    responsavel_cpf: '111.222.333-44',
    email_corporativo: 'contato@tech.com',
    telefone: '(11) 98765-4321',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Sala 42',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100'
};

// 2. Mock de uma empresa vazia para testar a robustez do layout (Fallbacks)
const mockCompanyMinimal = {};

describe('CompanyInfoCard Component', () => {

    it('deve renderizar todos os dados completos da empresa corretamente (Visão Detalhada)', () => {
        render(<CompanyInfoCard company={mockCompanyFull} />);

        // Bloco 1: Identificação
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
        expect(screen.getByText('123.456.789.000')).toBeInTheDocument();
        expect(screen.getByText('98765-4')).toBeInTheDocument();

        // Bloco 2: Responsável Legal
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument();
        expect(screen.getByText('111.222.333-44')).toBeInTheDocument();

        // Bloco 3: Contatos
        expect(screen.getByText('contato@tech.com')).toBeInTheDocument();
        expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();

        // Bloco 4: Endereço (Utilizando Regex para ignorar tags HTML internas geradas pelo Tailwind)
        expect(screen.getByText(/Avenida Paulista, 1000 - Sala 42/i)).toBeInTheDocument();
        expect(screen.getByText(/Bela Vista/i)).toBeInTheDocument();
        expect(screen.getByText(/São Paulo\/SP — 01310-100/i)).toBeInTheDocument();
    });

    it('deve exibir os fallbacks (valores padrão) quando os campos não forem informados, prevenindo quebra de layout', () => {
        render(<CompanyInfoCard company={mockCompanyMinimal} />);

        // Identificação (O "Não informado" vai aparecer em vários lugares, como Nome Fantasia, Email e Telefone)
        const naoInformadoEls = screen.getAllByText('Não informado');
        expect(naoInformadoEls.length).toBeGreaterThanOrEqual(3);

        expect(screen.getByText('Isento / Não Inf.')).toBeInTheDocument();
        expect(screen.getByText('Não Inf.')).toBeInTheDocument();

        // Responsável
        expect(screen.getByText('Nome não informado')).toBeInTheDocument();
        expect(screen.getByText('CPF não informado')).toBeInTheDocument();

        // Endereço
        expect(screen.getByText(/Rua\/Av. não informada, S\/N/i)).toBeInTheDocument();
        expect(screen.getByText(/Bairro não informado/i)).toBeInTheDocument();
        expect(screen.getByText(/Cidade\/UF — CEP/i)).toBeInTheDocument();
    });
});