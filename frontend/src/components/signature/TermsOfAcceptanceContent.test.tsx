import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TermsOfAcceptanceContent } from './TermsOfAcceptanceContent';

describe('TermsOfAcceptanceContent Component', () => {
    it('renders correctly with title and main sections', () => {
        render(<TermsOfAcceptanceContent />);
        
        expect(screen.getByText(/Termo de Aceite e Condições Prévias de Uso/i)).toBeInTheDocument();
        expect(screen.getByText(/1. NATUREZA DO SERVIÇO E OBRIGAÇÃO DE MEIO/i)).toBeInTheDocument();
        expect(screen.getByText(/2. CONSTATAÇÃO DE IRREGULARIDADES E LIMITAÇÃO DE ESCOPO/i)).toBeInTheDocument();
        expect(screen.getByText(/3. NECESSIDADE DE OUTORGA DE PROCURAÇÃO/i)).toBeInTheDocument();
        expect(screen.getByText(/4. TRATAMENTO DE DADOS \(LGPD\)/i)).toBeInTheDocument();
        expect(screen.getByText(/5. CIÊNCIA PRÉVIA DOS INSTRUMENTOS CONTRATUAIS/i)).toBeInTheDocument();
    });

    it('mentions specific legal obligations and laws', () => {
        render(<TermsOfAcceptanceContent />);
        
        expect(screen.getByText((content) => content.includes('obrigação de meio'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Lei nº 13.709/2018'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Lei nº 14.133/2021'))).toBeInTheDocument();
    });
});
