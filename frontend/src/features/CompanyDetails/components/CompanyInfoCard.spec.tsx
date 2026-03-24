import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompanyInfoCard } from './CompanyInfoCard';

const mockCompany = {
    nome_fantasia: 'Teste Fantasia',
    responsavel_nome: 'João da Silva',
    telefone: '(11) 99999-8888',
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP'
};

describe('CompanyInfoCard', () => {
    it('deve renderizar todos os dados da empresa corretamente', () => {
        render(<CompanyInfoCard company={mockCompany} />);

        expect(screen.getByText('Teste Fantasia')).toBeInTheDocument();
        expect(screen.getByText('João da Silva')).toBeInTheDocument();
        expect(screen.getByText('(11) 99999-8888')).toBeInTheDocument();
        expect(screen.getByText(/Rua das Flores, 123/i)).toBeInTheDocument();
        expect(screen.getByText(/Centro - São Paulo\/SP/i)).toBeInTheDocument();
    });

    it('deve exibir "-" para campos opcionais ausentes', () => {
        const minimalCompany = {
            logradouro: 'Rua X',
            numero: '0',
            bairro: 'Bairro Y',
            cidade: 'Cidade Z',
            estado: 'ZZ'
        };

        render(<CompanyInfoCard company={minimalCompany} />);

        // Nome Fantasia, Responsável e Telefone devem mostrar "-"
        const dashElements = screen.getAllByText('-');
        expect(dashElements.length).toBeGreaterThanOrEqual(3);
    });
});
