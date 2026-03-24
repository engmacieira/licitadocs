import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { SignatureInstructions } from './SignatureInstructions';

describe('SignatureInstructions', () => {
    afterEach(cleanup);
    
    it('should render the title correctly', () => {
        render(<SignatureInstructions />);
        expect(screen.getByText(/Como Assinar\?/i)).toBeInTheDocument();
    });

    it('should render all four instruction steps', () => {
        render(<SignatureInstructions />);
        
        // Use getAllByText for numbers which might appear more than once
        expect(screen.getAllByText('1')[0]).toBeInTheDocument();
        expect(screen.getByText(/Navegue pelas abas ao lado/i)).toBeInTheDocument();
        
        expect(screen.getAllByText('2')[0]).toBeInTheDocument();
        expect(screen.getByText(/Acesse o portal do Governo/i)).toBeInTheDocument();
        
        expect(screen.getAllByText('3')[0]).toBeInTheDocument();
        expect(screen.getByText(/Faça o login, anexe os PDFs/i)).toBeInTheDocument();
        
        expect(screen.getAllByText('4')[0]).toBeInTheDocument();
        expect(screen.getByText(/Faça o upload dos arquivos assinados/i)).toBeInTheDocument();
    });

    it('should render the "Dispensa de Cartório" info box', () => {
        render(<SignatureInstructions />);
        // Use a more specific match for the header
        expect(screen.getByText(/Dispensa de Cartório/i)).toBeInTheDocument();
        expect(screen.getByText(/validade legal plena/i)).toBeInTheDocument();
    });
});
