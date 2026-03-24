import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketChat } from './TicketChat';

describe('TicketChat', () => {
    const mockTicket = {
        id: 't1',
        subject: 'Dúvida sobre certidões',
        is_resolved: false,
        sender_id: 'user1'
    };

    const mockThread = [
        { id: 'm1', sender_id: 'user1', sender_name: 'João', content: 'Olá, como faço para emitir?', created_at: new Date().toISOString() },
        { id: 'm2', sender_id: 'admin', sender_name: 'Suporte', content: 'Olá João, use a aba Documentos.', created_at: new Date().toISOString() }
    ];

    const mockProps = {
        activeTicket: mockTicket,
        activeThread: mockThread,
        replyText: '',
        setReplyText: vi.fn(),
        handleReply: vi.fn(),
        isReplying: false,
        onBack: vi.fn()
    };

    it('should render chat history correctly', () => {
        render(<TicketChat {...mockProps} />);

        expect(screen.getByText('Dúvida sobre certidões')).toBeInTheDocument();
        expect(screen.getByText('Olá, como faço para emitir?')).toBeInTheDocument();
        expect(screen.getByText('Olá João, use a aba Documentos.')).toBeInTheDocument();
        expect(screen.getByText('Você')).toBeInTheDocument(); // sender_id matches activeTicket.sender_id
        expect(screen.getByText('Suporte')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
        render(<TicketChat {...mockProps} />);
        
        // Find the button that contains the ArrowLeft icon (first button)
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        
        expect(mockProps.onBack).toHaveBeenCalled();
    });

    it('should call setReplyText on input change', () => {
        render(<TicketChat {...mockProps} />);
        
        const input = screen.getByPlaceholderText('Escreva sua resposta...');
        fireEvent.change(input, { target: { value: 'Obrigado' } });
        
        expect(mockProps.setReplyText).toHaveBeenCalledWith('Obrigado');
    });

    it('should call handleReply on form submit', () => {
        render(<TicketChat {...mockProps} replyText="Minha resposta" />);
        
        const form = screen.getByPlaceholderText('Escreva sua resposta...').closest('form');
        fireEvent.submit(form!);
        
        expect(mockProps.handleReply).toHaveBeenCalled();
    });

    it('should show "Chamado encerrado" and hide input when resolved', () => {
        render(<TicketChat {...mockProps} activeTicket={{ ...mockTicket, is_resolved: true }} />);
        
        expect(screen.getByText('Chamado encerrado.')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Escreva sua resposta...')).not.toBeInTheDocument();
    });

    it('should disable reply button if replyText is empty', () => {
        render(<TicketChat {...mockProps} replyText="" />);
        
        const buttons = screen.getAllByRole('button');
        // Back button is index 0, Send button is index 1
        const sendButton = buttons[1];
        
        expect(sendButton).toBeDisabled();
    });
});
