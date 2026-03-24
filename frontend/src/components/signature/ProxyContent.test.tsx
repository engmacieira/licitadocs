import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProxyContent } from './ProxyContent';

describe('ProxyContent Component', () => {
    it('renders all main sections', () => {
        render(<ProxyContent />);
        
        expect(screen.getByText(/1. DOS PODERES ESPECÍFICOS/i)).toBeInTheDocument();
        expect(screen.getByText(/2. DA FINALIDADE EXCLUSIVA/i)).toBeInTheDocument();
        expect(screen.getByText(/3. DA VEDAÇÃO ABSOLUTA/i)).toBeInTheDocument();
        expect(screen.getByText(/4. DA VALIDADE E DA RENOVAÇÃO/i)).toBeInTheDocument();
    });

    it('lists specific powers and limitations', () => {
        render(<ProxyContent />);
        
        expect(screen.getByText((content) => content.includes('Regularidade Fiscal e Tributária'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Justiça do Trabalho'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Confessar dívidas'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('movimentar contas bancárias'))).toBeInTheDocument();
    });

    it('mentions the relevant law', () => {
        render(<ProxyContent />);
        expect(screen.getByText((content) => content.includes('Lei 14.133/2021'))).toBeInTheDocument();
    });
});
