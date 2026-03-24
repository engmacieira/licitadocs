import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProxyDocument } from './ProxyDocument';

describe('ProxyDocument Component', () => {
    const defaultProps = {
        razaoSocial: 'Empresa do Cliente',
        cnpj: '00.000.000/0001-91',
        endereco: 'Avenida Principal, 456, Rio de Janeiro/RJ',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        responsavel: 'Maria Oliveira',
        cpfResponsavel: '999.888.777-66',
    };

    it('renders outorgante and outorgada information', () => {
        render(<ProxyDocument {...defaultProps} />);
        
        expect(screen.getByText(/Instrumento Particular de Procuração/i)).toBeInTheDocument();
        expect(screen.getByText(/OUTORGANTE:/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Empresa do Cliente/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/OUTORGADA:/i)).toBeInTheDocument();
        
        // Matheus aparece mais de uma vez (nome da empresa e nome do titular)
        const matheus = screen.getAllByText(/MATHEUS HENRIQUE MACIEIRA/i);
        expect(matheus.length).toBeGreaterThan(0);
    });

    it('applies feminine pronouns correctly for Maria', () => {
        render(<ProxyDocument {...defaultProps} genero="feminino" />);
        
        expect(screen.getByText(/administradora legal/i)).toBeInTheDocument();
        expect(screen.getByText(/Sra./i)).toBeInTheDocument();
        expect(screen.getAllByText(/Maria Oliveira/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/portadora/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/inscrita/i).length).toBeGreaterThan(0);
    });

    it('applies masculine pronouns correctly', () => {
        render(<ProxyDocument {...defaultProps} responsavel="José Silva" genero="masculino" />);
        
        expect(screen.getByText(/administrador legal/i)).toBeInTheDocument();
        expect(screen.getByText(/Sr./i)).toBeInTheDocument();
        expect(screen.getAllByText(/José Silva/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/portador/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/inscrito/i).length).toBeGreaterThan(0);
    });

    it('renders the date and place correctly', () => {
        const mockDate = new Date(2026, 5, 15); // Junho é 5
        vi.setSystemTime(mockDate);
        
        render(<ProxyDocument {...defaultProps} />);
        
        expect(screen.getByText(/Rio de Janeiro\/RJ, 15 de Junho de 2026/i)).toBeInTheDocument();
        
        vi.useRealTimers();
    });

    it('renders the signature line for the outorgante', () => {
        render(<ProxyDocument {...defaultProps} />);
        
        // Empresa do Cliente aparece na qualificação e na assinatura
        const signatureArea = screen.getAllByText('Empresa do Cliente', { selector: '.font-bold' });
        expect(signatureArea.length).toBeGreaterThan(0);
        
        // Verifica se ao menos um dos containers de assinatura tem o texto do representante
        const signatureContainers = screen.getAllByText(/Representada por:/i);
        expect(signatureContainers.some(node => node.textContent?.includes('Maria Oliveira'))).toBe(true);
    });
});
