import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import { TicketConversation } from './TicketConversation';
import { MemoryRouter } from 'react-router-dom';

describe('TicketConversation', () => {
    const defaultProps = {
        activeTicket: null,
        activeThread: [],
        replyText: '',
        setReplyText: vi.fn(),
        handleReply: vi.fn(),
        handleResolve: vi.fn(),
        isSubmitting: false,
    };

    const mockTicket = {
        id: 't1',
        subject: 'Problema técnico',
        company_name: 'Empresa A',
        company_id: 'c1',
        sender_name: 'Mateus Cliente',
        sender_id: 'user_1',
        is_resolved: false
    };

    const mockThread = [
        {
            id: 'm1',
            sender_id: 'user_1',
            sender_name: 'Mateus Cliente',
            content: 'Meu upload está travando.',
            created_at: '2024-03-22T10:00:00Z'
        },
        {
            id: 'm2',
            sender_id: 'admin_1',
            sender_name: 'Suporte Admin',
            content: 'Poderia enviar o log de erro?',
            created_at: '2024-03-22T10:05:00Z'
        }
    ];

    it('deve exibir mensagem de seleção quando não há ticket ativo', () => {
        render(<TicketConversation {...defaultProps} />);
        expect(screen.getByText(/Selecione um ticket na lista ao lado/i)).toBeInTheDocument();
    });

    it('deve renderizar o cabeçalho do ticket corretamente', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} />
            </MemoryRouter>
        );
        
        expect(screen.getByText(mockTicket.subject)).toBeInTheDocument();
        expect(screen.getByText(mockTicket.company_name)).toBeInTheDocument();
        expect(screen.getByText(mockTicket.sender_name)).toBeInTheDocument();
    });

    it('deve renderizar a thread de mensagens corretamente', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} activeThread={mockThread} />
            </MemoryRouter>
        );
        
        expect(screen.getByText(mockThread[0].content)).toBeInTheDocument();
        expect(screen.getByText(mockThread[1].content)).toBeInTheDocument();
        
        // Verifica se identifica quem é o admin ("Você (Suporte)")
        expect(screen.getByText('Você (Suporte)')).toBeInTheDocument();
        
        // O nome do remetente aparece no cabeçalho e na primeira mensagem, usamos getAll ou refinamos
        expect(screen.getAllByText(mockThread[0].sender_name).length).toBeGreaterThanOrEqual(1);
    });

    it('deve chamar handleResolve ao clicar no botão de resolver', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} />
            </MemoryRouter>
        );
        
        const resolveButton = screen.getByRole('button', { name: /Marcar como Resolvido/i });
        fireEvent.click(resolveButton);
        
        expect(defaultProps.handleResolve).toHaveBeenCalled();
    });

    it('não deve exibir botão de resolver se o ticket já estiver resolvido', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={{ ...mockTicket, is_resolved: true }} />
            </MemoryRouter>
        );
        
        expect(screen.queryByRole('button', { name: /Marcar como Resolvido/i })).not.toBeInTheDocument();
        expect(screen.getByText('Este ticket foi marcado como resolvido.')).toBeInTheDocument();
    });

    it('deve gerenciar o texto da resposta', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} replyText="Minha resposta" />
            </MemoryRouter>
        );
        
        const input = screen.getByPlaceholderText(/Digite sua resposta.../i);
        expect(input).toHaveValue('Minha resposta');
        
        fireEvent.change(input, { target: { value: 'Novo texto' } });
        expect(defaultProps.setReplyText).toHaveBeenCalledWith('Novo texto');
    });

    it('deve disparar handleReply ao submeter o formulário', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} replyText="Resposta pronta" />
            </MemoryRouter>
        );
        
        const submitButton = screen.getByRole('button', { name: /Enviar/i });
        fireEvent.submit(submitButton.closest('form')!);
        
        expect(defaultProps.handleReply).toHaveBeenCalled();
    });

    it('deve desabilitar o botão de envio se o texto estiver vazio', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} replyText="" />
            </MemoryRouter>
        );
        
        const submitButton = screen.getByRole('button', { name: /Enviar/i });
        expect(submitButton).toBeDisabled();
    });

    it('deve mostrar estado de loading no botão de envio', () => {
        render(
            <MemoryRouter>
                <TicketConversation {...defaultProps} activeTicket={mockTicket} replyText="Teste" isSubmitting={true} />
            </MemoryRouter>
        );
        
        // No componente Button, isLoading geralmente adiciona um spinner ou desabilita.
        // Como o Button é um componente customizado, confio que o teste de prop funciona.
        const submitButton = screen.getByRole('button', { name: /Enviar/i });
        expect(submitButton).toBeDisabled();
    });
});
