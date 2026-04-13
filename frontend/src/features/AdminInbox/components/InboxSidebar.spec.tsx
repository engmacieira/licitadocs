import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import { InboxSidebar } from './InboxSidebar';

// Mock do Autocomplete [US-2903] para evitar que o react-select quebre os testes isolados
vi.mock('../../DocumentVault/components/CompanyAutocomplete', () => ({
    CompanyAutocomplete: () => <div data-testid="company-autocomplete-mock" />
}));

describe('InboxSidebar', () => {
    // Props atualizadas incluindo a nova estrutura de filtros da US-2903
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
        filters: {
            searchTerm: '',
            setSearchTerm: vi.fn(),
            statusFilter: 'all' as const,
            setStatusFilter: vi.fn(),
            selectedCompanyId: '',
            setSelectedCompanyId: vi.fn(),
            sortOrder: 'recent' as const,
            setSortOrder: vi.fn(),
            companies: []
        }
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
            content: 'Manutenção programada',
            sender_name: 'Admin',
            created_at: '2024-03-22T12:00:00Z',
            is_read: false
        }
    ];

    it('deve renderizar o estado de loading corretamente', () => {
        render(<InboxSidebar {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve alternar abas ao clicar nos botões de navegação', () => {
        render(<InboxSidebar {...defaultProps} />);

        const alertsTab = screen.getByRole('button', { name: /Avisos/i });
        fireEvent.click(alertsTab);

        expect(defaultProps.setActiveTab).toHaveBeenCalledWith('alerts');
    });

    it('deve exibir mensagem de "Nenhum ticket" quando a lista está vazia', () => {
        render(<InboxSidebar {...defaultProps} />);
        expect(screen.getByText('Nenhum ticket encontrado com estes filtros.')).toBeInTheDocument();
    });

    it('deve listar os tickets corretamente', () => {
        render(<InboxSidebar {...defaultProps} parentTickets={mockTickets} />);

        expect(screen.getByText('Dúvida no Upload')).toBeInTheDocument();
        expect(screen.getByText('Erro de Login')).toBeInTheDocument();

        // Verifica a renderização de status de resolvido
        const resolvedTags = screen.getAllByText('Resolvido');
        expect(resolvedTags).toHaveLength(1);
    });

    it('deve chamar setSelectedTicketId ao clicar num ticket', () => {
        render(<InboxSidebar {...defaultProps} parentTickets={mockTickets} />);

        // O clique deve ocorrer no elemento <button> que engloba o ticket
        const ticketButton = screen.getByText('Dúvida no Upload').closest('button');
        fireEvent.click(ticketButton!);

        expect(defaultProps.setSelectedTicketId).toHaveBeenCalledWith('t1');
    });

    it('deve destacar o ticket selecionado', () => {
        render(<InboxSidebar {...defaultProps} parentTickets={mockTickets} selectedTicketId="t1" />);

        const selectedButton = screen.getByText('Dúvida no Upload').closest('button');
        // Verifica a classe específica aplicada ao item selecionado
        expect(selectedButton).toHaveClass('border-l-purple-600');
    });

    it('deve renderizar a interface de filtros (US-2903)', () => {
        render(<InboxSidebar {...defaultProps} />);

        // Verifica a barra de busca e o select de status
        expect(screen.getByPlaceholderText('Buscar no assunto ou empresa...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Todos Status')).toBeInTheDocument();
        // Verifica se o mock do Autocomplete foi carregado
        expect(screen.getByTestId('company-autocomplete-mock')).toBeInTheDocument();
    });

    it('deve listar os avisos corretamente na aba de avisos', () => {
        render(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={mockAlerts} />);

        expect(screen.getByText(mockAlerts[0].subject)).toBeInTheDocument();
        expect(screen.getByText(mockAlerts[0].company_name)).toBeInTheDocument();
        expect(screen.getByText(/Disparado por Admin/)).toBeInTheDocument();
    });

    it('deve chamar setSelectedAlertId ao clicar num aviso', () => {
        render(<InboxSidebar {...defaultProps} activeTab="alerts" alerts={mockAlerts} />);

        const alertButton = screen.getByText(mockAlerts[0].subject).closest('button');
        fireEvent.click(alertButton!);

        expect(defaultProps.setSelectedAlertId).toHaveBeenCalledWith(mockAlerts[0].id);
    });
});