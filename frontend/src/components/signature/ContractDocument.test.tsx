import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContractDocument } from './ContractDocument';

describe('ContractDocument Component', () => {
    const defaultProps = {
        razaoSocial: 'Minha Empresa LTDA',
        cnpj: '12.345.678/0001-00',
        endereco: 'Rua Teste, 123, São Paulo/SP',
        cidade: 'São Paulo',
        estado: 'SP',
        responsavel: 'João Silva',
        cpfResponsavel: '111.222.333-44',
    };

    it('renders with company and representative information', () => {
        render(<ContractDocument {...defaultProps} />);
        
        // Check header
        expect(screen.getByRole('heading', { level: 1, name: /Contrato de Prestação de Serviços de Tecnologia/i })).toBeInTheDocument();
        
        // Check qualification
        expect(screen.getAllByText(/Minha Empresa LTDA/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/12.345.678\/0001-00/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/João Silva/i).length).toBeGreaterThan(0);
    });

    it('applies masculine pronouns correctly', () => {
        render(<ContractDocument {...defaultProps} genero="masculino" />);
        
        expect(screen.getByText(/administrador legal/i)).toBeInTheDocument();
        expect(screen.getByText(/portador/i)).toBeInTheDocument();
        expect(screen.getByText(/inscrito no CPF/i)).toBeInTheDocument();
    });

    it('applies feminine pronouns correctly', () => {
        render(<ContractDocument {...defaultProps} genero="feminino" />);
        
        expect(screen.getByText(/administradora legal/i)).toBeInTheDocument();
        expect(screen.getByText(/portadora/i)).toBeInTheDocument();
        expect(screen.getByText(/inscrita no CPF/i)).toBeInTheDocument();
    });

    it('uses fallback pronouns when gender is not provided', () => {
        render(<ContractDocument {...defaultProps} />);
        
        expect(screen.getByText(/administrador\(a\) legal/i)).toBeInTheDocument();
        expect(screen.getByText(/portador\(a\)/i)).toBeInTheDocument();
        expect(screen.getByText(/inscrito\(a\) no CPF/i)).toBeInTheDocument();
    });

    it('renders the date correctly', () => {
        const mockDate = new Date(2026, 2, 22); // Março é 2 (zero-indexed)
        vi.setSystemTime(mockDate);
        
        render(<ContractDocument {...defaultProps} />);
        
        expect(screen.getByText(/São Paulo\/SP, 22 de Março de 2026/i)).toBeInTheDocument();
        
        vi.useRealTimers();
    });

    it('renders signature areas for both parties', () => {
        render(<ContractDocument {...defaultProps} />);
        
        expect(screen.getByText('Minha Empresa LTDA', { selector: '.font-bold' })).toBeInTheDocument();
        expect(screen.getByText('LICITADOCS TECNOLOGIA S.A.', { selector: '.font-bold' })).toBeInTheDocument();
    });
});
