import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HelpCenterTabs } from './HelpCenterTabs';

describe('HelpCenterTabs', () => {
    const mockProps = {
        activeTab: 'tickets' as const,
        setActiveTab: vi.fn(),
        parentTickets: [
            { id: 't1', subject: 'Ticket 1', content: 'Conteúdo 1', created_at: new Date().toISOString(), is_resolved: false }
        ],
        alerts: [
            { id: 'a1', subject: 'Alerta 1', content: 'Aviso 1', created_at: new Date().toISOString(), is_read: false }
        ],
        isLoading: false,
        onOpenNewTicket: vi.fn(),
        onSelectTicket: vi.fn(),
        onSelectAlert: vi.fn(),
        handleMarkAsRead: vi.fn()
    };

    it('should render loading state', () => {
        render(<HelpCenterTabs {...mockProps} isLoading={true} />);
        expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('should render tickets list when activeTab is "tickets"', () => {
        render(<HelpCenterTabs {...mockProps} />);
        
        expect(screen.getByText('Histórico de Chamados')).toBeInTheDocument();
        expect(screen.getByText('Ticket 1')).toBeInTheDocument();
    });

    it('should render alerts list when activeTab is "alerts"', () => {
        render(<HelpCenterTabs {...mockProps} activeTab="alerts" />);
        
        expect(screen.getByText('Alertas Automáticos')).toBeInTheDocument();
        expect(screen.getByText('Alerta 1')).toBeInTheDocument();
    });

    it('should call setActiveTab when tab buttons are clicked', () => {
        render(<HelpCenterTabs {...mockProps} />);
        
        const alertsTabButton = screen.getByText('Avisos');
        fireEvent.click(alertsTabButton);
        
        expect(mockProps.setActiveTab).toHaveBeenCalledWith('alerts');
    });

    it('should call onOpenNewTicket when "Novo Chamado" is clicked', () => {
        render(<HelpCenterTabs {...mockProps} />);
        
        const newTicketButton = screen.getByText('Novo Chamado');
        fireEvent.click(newTicketButton);
        
        expect(mockProps.onOpenNewTicket).toHaveBeenCalled();
    });

    it('should call onSelectTicket when a ticket card is clicked', () => {
        render(<HelpCenterTabs {...mockProps} />);
        
        const ticketCard = screen.getByText('Ticket 1');
        fireEvent.click(ticketCard.closest('div')!); // TicketCard root is a div
        
        expect(mockProps.onSelectTicket).toHaveBeenCalledWith('t1');
    });

    it('should call onSelectAlert when an alert card is clicked', () => {
        render(<HelpCenterTabs {...mockProps} activeTab="alerts" />);
        
        const alertCard = screen.getByText('Alerta 1');
        fireEvent.click(alertCard.closest('div')!);
        
        expect(mockProps.onSelectAlert).toHaveBeenCalledWith('a1');
    });

    it('should call handleMarkAsRead when "Ciente" is clicked in alert card', () => {
        render(<HelpCenterTabs {...mockProps} activeTab="alerts" />);
        
        const cienteButton = screen.getByText('Ciente');
        fireEvent.click(cienteButton);
        
        expect(mockProps.handleMarkAsRead).toHaveBeenCalled();
    });

    it('should render empty state for tickets', () => {
        render(<HelpCenterTabs {...mockProps} parentTickets={[]} />);
        expect(screen.getByText('Nenhum ticket aberto')).toBeInTheDocument();
    });

    it('should render empty state for alerts', () => {
        render(<HelpCenterTabs {...mockProps} activeTab="alerts" alerts={[]} />);
        expect(screen.getByText('Nenhum aviso')).toBeInTheDocument();
    });
});
