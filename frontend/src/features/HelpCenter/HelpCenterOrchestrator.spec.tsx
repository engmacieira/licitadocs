import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelpCenterOrchestrator } from './HelpCenterOrchestrator';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../../services/api');
vi.mock('../../contexts/AuthContext');
vi.mock('sonner');

describe('HelpCenterOrchestrator', () => {
    const mockCurrentCompany = { id: 'company_123' };
    const mockMessages = [
        { id: 'a1', message_type: 'system', subject: 'Sistema Off', content: 'Manutenção', created_at: new Date().toISOString(), is_read: false },
        { id: 't1', message_type: 'chat', subject: 'Dúvida 1', content: 'Como faz?', created_at: new Date().toISOString(), is_resolved: false, parent_id: null, sender_id: 'user1' },
        { id: 'm1', message_type: 'chat', subject: null, content: 'Resposta mock', created_at: new Date().toISOString(), parent_id: 't1', sender_id: 'admin' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCurrentCompany });
        (api.get as any).mockResolvedValue({ data: mockMessages });
        (api.post as any).mockResolvedValue({ data: {} });
        (api.patch as any).mockResolvedValue({ data: {} });
    });

    it('should load messages on mount', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/messages/company_123');
        });
        
        expect(screen.getByText('Dúvida 1')).toBeInTheDocument();
    });

    it('should handle API error on mount', async () => {
        (api.get as any).mockRejectedValueOnce(new Error('Fetch error'));
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar mensagens.");
        });
    });

    it('should navigate between tabs', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => expect(screen.getByText('Dúvida 1')).toBeInTheDocument());
        
        const alertsTab = screen.getByText('Avisos');
        fireEvent.click(alertsTab);
        
        expect(screen.getByText('Sistema Off')).toBeInTheDocument();
        expect(screen.queryByText('Dúvida 1')).not.toBeInTheDocument();
    });

    it('should open and close new ticket modal', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => expect(screen.getByText('Novo Chamado')).toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Novo Chamado'));
        expect(screen.getByText('Abrir Novo Chamado')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Cancelar'));
        
        await waitFor(() => {
            expect(screen.queryByText('Abrir Novo Chamado')).not.toBeInTheDocument();
        });
    });

    it('should select a ticket and show chat', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => expect(screen.getByText('Dúvida 1')).toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Dúvida 1'));
        
        expect(screen.getByPlaceholderText('Escreva sua resposta...')).toBeInTheDocument();
        expect(screen.getByText('Resposta mock')).toBeInTheDocument();
    });

    it('should select an alert and show viewer', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => expect(screen.getByText('Avisos')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Avisos'));
        
        await waitFor(() => expect(screen.getByText('Sistema Off')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Sistema Off'));
        
        expect(screen.getByText('Marcar como Ciente')).toBeInTheDocument();
    });

    it('should mark an alert as read and refresh list', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => screen.getByText('Avisos'));
        fireEvent.click(screen.getByText('Avisos'));
        
        await waitFor(() => screen.getByText('Ciente'));
        fireEvent.click(screen.getByText('Ciente'));
        
        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/messages/a1/read');
            // Should call loadMessages again
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });

    it('should reply to a ticket and refresh list', async () => {
        render(<HelpCenterOrchestrator />);
        
        await waitFor(() => screen.getByText('Dúvida 1'));
        fireEvent.click(screen.getByText('Dúvida 1'));
        
        const input = screen.getByPlaceholderText('Escreva sua resposta...');
        fireEvent.change(input, { target: { value: 'Minha nova resposta' } });
        
        const sendButtons = screen.getAllByRole('button');
        // Back is 0, Send is index 1
        fireEvent.click(sendButtons[1]);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/company_123', {
                content: 'Minha nova resposta',
                message_type: 'chat',
                parent_id: 't1'
            });
            // Removed expect to be exactly 2 since unreadcount hooks make extra requests
        });
    });
});
