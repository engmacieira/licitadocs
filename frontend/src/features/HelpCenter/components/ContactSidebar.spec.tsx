import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContactSidebar } from './ContactSidebar';
import { CONTACT_CONFIG, APP_CONFIG } from '../../../config/app.config';

describe('ContactSidebar', () => {
    it('should render contact information correctly', () => {
        render(<ContactSidebar />);

        expect(screen.getByText('Fale Conosco')).toBeInTheDocument();
        expect(screen.getByText(CONTACT_CONFIG.supportEmail)).toBeInTheDocument();
        expect(screen.getByText(CONTACT_CONFIG.whatsapp.display)).toBeInTheDocument();
        expect(screen.getByText(APP_CONFIG.address)).toBeInTheDocument();
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
