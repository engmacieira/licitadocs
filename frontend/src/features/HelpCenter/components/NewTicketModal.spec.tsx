import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewTicketModal } from './NewTicketModal';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../../../services/api');
vi.mock('../../../contexts/AuthContext');
vi.mock('sonner');

describe('NewTicketModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCurrentCompany = { id: 'company_123' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCurrentCompany });
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <NewTicketModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render correctly when isOpen is true', () => {
        render(<NewTicketModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByText('Abrir Novo Chamado')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ex: Dúvida sobre certidão/i)).toBeInTheDocument();
        expect(screen.getByText('Mensagem Detalhada')).toBeInTheDocument();
    });

    it('should show error toast if fields are empty on submit', async () => {
        render(<NewTicketModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const submitButton = screen.getByText('Enviar Ticket');
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Preencha todos os campos", expect.anything());
    });

    it('should call api.post and handle success correctly', async () => {
        (api.post as any).mockResolvedValue({ data: {} });
        
        render(<NewTicketModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        fireEvent.change(screen.getByPlaceholderText(/Ex: Dúvida sobre certidão/i), { target: { value: 'Suporte Técnico' } });
        fireEvent.change(screen.getByPlaceholderText(/Descreva com detalhes/i), { target: { value: 'Não consigo acessar o sistema.' } });
        
        const submitButton = screen.getByText('Enviar Ticket');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/company_123', {
                subject: 'Suporte Técnico',
                content: 'Não consigo acessar o sistema.',
                message_type: 'chat'
            });
        });

        expect(toast.success).toHaveBeenCalledWith("Chamado aberto com sucesso!", expect.anything());
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle API error correctly', async () => {
        (api.post as any).mockRejectedValue(new Error('API Error'));
        
        render(<NewTicketModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        fireEvent.change(screen.getByPlaceholderText(/Ex: Dúvida sobre certidão/i), { target: { value: 'Erro fatal' } });
        fireEvent.change(screen.getByPlaceholderText(/Descreva com detalhes/i), { target: { value: 'Socorro' } });
        
        const submitButton = screen.getByText('Enviar Ticket');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao abrir o chamado.", expect.anything());
        });
        
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', () => {
        render(<NewTicketModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(mockOnClose).toHaveBeenCalled();
    });
});
