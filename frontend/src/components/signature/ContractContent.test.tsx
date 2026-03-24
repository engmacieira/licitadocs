import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContractContent } from './ContractContent';

describe('ContractContent Component', () => {
    it('renders all main clauses', () => {
        render(<ContractContent />);
        
        expect(screen.getByText(/CLÁUSULA 1ª – DO OBJETO E ESCOPO DO SERVIÇO/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 2ª – DOS LIMITES DE ATUAÇÃO E OBRIGAÇÃO DE MEIO/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 3ª – DAS OBRIGAÇÕES DA CONTRATANTE/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 4ª – DA PROTEÇÃO DE DADOS \(LGPD\)/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 5ª – DOS NÍVEIS DE SERVIÇO \(SLA\)/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 6ª – DA REMUNERAÇÃO/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 7ª – DO PRAZO E CANCELAMENTO \(CHURN\)/i)).toBeInTheDocument();
        expect(screen.getByText(/CLÁUSULA 8ª – DA FORMALIZAÇÃO E FORO/i)).toBeInTheDocument();
    });

    it('contains specific legal terms', () => {
        render(<ContractContent />);
        
        expect(screen.getByText((content) => content.includes('Software as a Service'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Lei nº 14.133/2021'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Uptime'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Comarca de Lisboa'))).toBeInTheDocument();
    });
});
