import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContactSidebar } from './ContactSidebar';

describe('ContactSidebar', () => {
    it('should render contact information correctly', () => {
        render(<ContactSidebar />);

        expect(screen.getByText('Fale Conosco')).toBeInTheDocument();
        expect(screen.getByText('suporte@licitadocs.com.br')).toBeInTheDocument();
        expect(screen.getByText('(00) 00000-0000')).toBeInTheDocument();
        expect(screen.getByText('Braúnas / MG')).toBeInTheDocument();
    });

    it('should render opening hours correctly', () => {
        render(<ContactSidebar />);

        expect(screen.getByText('Horário de Atendimento')).toBeInTheDocument();
        expect(screen.getByText(/Segunda a Sexta/)).toBeInTheDocument();
        expect(screen.getByText(/08h00 às 18h00/)).toBeInTheDocument();
    });

    it('should render holiday calendar information', () => {
        render(<ContactSidebar />);

        expect(screen.getByText('Calendário de Feriados')).toBeInTheDocument();
        expect(screen.getByText(/O suporte e a contagem de prazos são suspensos/)).toBeInTheDocument();
    });
});
