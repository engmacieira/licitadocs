import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import { InboxSidebar } from './InboxSidebar';

describe('InboxSidebar', () => {
    const defaultProps = {
        activeTab: 'tickets' as const,
        setActiveTab: vi.fn(),
        isLoading: false,
        parentTickets: [],
        alerts: [],
        selectedTicketId: null,
        setSelectedTicketId: vi.fn(),
        selectedAlertId: null,
        setSelectedAlertId: vi.fn(),
    };

    const mockTickets = [
        { 
            id: 't1', 
            subject: 'Dúvida no Upload', 
            created_at: '2024-03-22T10:00:00Z', 
            company_name: 'Empresa Alpha', 
            content: 'Não consigo subir o PDF...',
            is_resolved: false
        },
        { 
            id: 't2', 
            subject: 'Erro de Login', 
            created_at: '2024-03-21T15:30:00Z', 
            company_name: 'Empresa Beta', 
            content: 'Meu usuário está bloqueado.',
            is_resolved: true
        }
    ];

    const mockAlerts = [
        {
            id: 'a1',
            subject: 'Mensagem do Sistema',
            company_name: 'Empresa Alpha',
            content: 'Aviso importante...',
            is_read: true,
            sender_name: 'Admin Admin',
            created_at: '2024-03-20T12:00:00Z'
        }
    ];

    it('deve renderizar o estado de loading corretamente', () => {
        render(<InboxSidebar {...defaultProps} isLoading={true} />);
        expect(screen.getByText('A carregar...')).toBeInTheDocument();
    });

    it('deve alternar abas ao clicar nos botões de navegação', () => {
        render(<InboxSidebar {...defaultProps} />);
        
        const ticketsTab = screen.getByRole('button', { name: /Tickets/i });
        const alertsTab = screen.getByRole('button', { name: /Avisos Emitidos/i });

        fireEvent.click(alertsTab);
        expect(defaultProps.setActiveTab).toHaveBeenCalledWith('alerts');
    });

    it('deve exibir mensagem de "Nenhum ticket" quando a lista está vazia', () => {
        render(<InboxSidebar {...defaultProps} activeTab="tickets" parentTickets={[]} />);
        expect(screen.getByText('Nenhum ticket aberto.')).toBeInTheDocument();
    });

    it('deve listar os tickets corretamente', () => {
        render(<InboxSidebar {...defaultProps} activeTab="tickets" parentTickets={mockTickets} />);
        
        expect(screen.getByText(mockTickets[0].subject)).toBeInTheDocument();
        expect(screen.getByText(mockTickets[0].company_name)).toBeInTheDocument();
        expect(screen.getByText(mockTickets[1].subject)).toBeInTheDocument();
        expect(screen.getByText('Resolvido')).toBeInTheDocument();
        expect(screen.getByText('Aberto')).toBeInTheDocument();
    });

    it('deve chamar setSelectedTicketId ao clicar num ticket', () => {
        render(<InboxSidebar {...defaultProps} activeTab="tickets" parentTickets={mockTickets} />);
        
        const ticketButton = screen.getByText(mockTickets[0].subject).closest('button');
        fireEvent.click(ticketButton!);
        
        expect(defaultProps.setSelectedTicketId).toHaveBeenCalledWith(mockTickets[0].id);
    });

    it('deve destacar o ticket selecionado', () => {
        render(<InboxSidebar {...defaultProps} activeTab="tickets" parentTickets={mockTickets} selectedTicketId="t1" />);
        
        const selectedButton = screen.getByText(mockTickets[0].subject).closest('button');
        expect(selectedButton).toHaveClass('border-purple-500');
    });

    it('deve listar os avisos corretamente na aba de avisos', () => {
        render(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={mockAlerts} />);
        
        expect(screen.getByText(mockAlerts[0].subject)).toBeInTheDocument();
        expect(screen.getByText(mockAlerts[0].company_name)).toBeInTheDocument();
        expect(screen.getByText(/Disparado por Admin Admin/)).toBeInTheDocument();
    });

    it('deve chamar setSelectedAlertId ao clicar num aviso', () => {
        render(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={mockAlerts} />);
        
        const alertButton = screen.getByText(mockAlerts[0].subject).closest('button');
        fireEvent.click(alertButton!);
        
        expect(defaultProps.setSelectedAlertId).toHaveBeenCalledWith(mockAlerts[0].id);
    });

    it('deve mostrar ícone de leitura correta para avisos', () => {
        const { rerender } = render(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={mockAlerts} />);
        expect(screen.getByTitle('Lido pelo cliente')).toBeInTheDocument();

        rerender(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={[{ ...mockAlerts[0], is_read: false }]} />);
        expect(screen.getByTitle('Ainda não lido')).toBeInTheDocument();
    });
});
