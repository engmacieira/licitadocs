import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { InboxOrchestrator } from './InboxOrchestrator';
import api from '../../services/api';
import { toast } from 'sonner';
import { MemoryRouter } from 'react-router-dom';

// Mock do módulo de API
vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn()
    }
}));

// Mock do Sonner Toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
    }
}));

describe('InboxOrchestrator', () => {
    const mockTickets = [
        { 
            id: 't1', 
            parent_id: null, 
            subject: 'Ticket 1', 
            company_id: 'c1', 
            company_name: 'Empresa A', 
            content: 'Mensagem 1', 
            sender_id: 'u1', 
            sender_name: 'User 1', 
            created_at: '2024-03-22T10:00:00Z', 
            is_resolved: false 
        },
        { 
            id: 't2', 
            parent_id: 't1', 
            subject: null, 
            company_id: 'c1', 
            company_name: 'Empresa A', 
            content: 'Resposta para t1', 
            sender_id: 'admin', 
            sender_name: 'Admin', 
            created_at: '2024-03-22T10:05:00Z', 
            is_resolved: false 
        }
    ];

    const mockAlerts = [
        { 
            id: 'a1', 
            subject: 'Alerta 1', 
            company_id: 'c2', 
            company_name: 'Empresa B', 
            content: 'Conteúdo Alerta', 
            sender_name: 'Admin', 
            created_at: '2024-03-22T11:00:00Z', 
            is_read: false 
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/messages/admin/all') return Promise.resolve({ data: mockTickets });
            if (url === '/messages/admin/alerts') return Promise.resolve({ data: mockAlerts });
            if (url === '/companies') return Promise.resolve({ data: [] });
            return Promise.resolve({ data: [] });
        });
        (api.post as any).mockResolvedValue({ data: {} });
        (api.patch as any).mockResolvedValue({ data: {} });
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <InboxOrchestrator />
        </MemoryRouter>
    );

    it('deve carregar tickets e alertas na montagem', async () => {
        renderComponent();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/messages/admin/all');
            expect(api.get).toHaveBeenCalledWith('/messages/admin/alerts');
        });

        // Verifica se o ticket pai aparece na lista (sidebar)
        expect(screen.getByText('Ticket 1')).toBeInTheDocument();
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
    });

    it('deve selecionar um ticket e carregar a conversa', async () => {
        renderComponent();
        
        await waitFor(() => screen.getByText('Ticket 1'));
        
        fireEvent.click(screen.getByText('Ticket 1').closest('button')!);
        
        // Verifica se a conversa secundária aparece (activeThread)
        expect(screen.getByText('Resposta para t1')).toBeInTheDocument();
        expect(screen.getByText('Você (Suporte)')).toBeInTheDocument();
    });

    it('deve enviar uma resposta e recarregar os tickets', async () => {
        renderComponent();
        
        await waitFor(() => screen.getByText('Ticket 1'));
        fireEvent.click(screen.getByText('Ticket 1').closest('button')!);
        
        const input = screen.getByPlaceholderText(/Digite sua resposta.../i);
        fireEvent.change(input, { target: { value: 'Nova resposta do suporte' } });
        
        const sendButton = screen.getByRole('button', { name: /Enviar/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/c1', {
                content: 'Nova resposta do suporte',
                message_type: 'chat',
                parent_id: 't1'
            });
            expect(toast.success).toHaveBeenCalledWith("Resposta enviada!");
            // Verifica se recarregou tickets
            expect(api.get).toHaveBeenCalledWith('/messages/admin/all');
        });
    });

    it('deve resolver um ticket e recarregar', async () => {
        renderComponent();
        
        await waitFor(() => screen.getByText('Ticket 1'));
        fireEvent.click(screen.getByText('Ticket 1').closest('button')!);
        
        const resolveButton = screen.getByRole('button', { name: /Marcar como Resolvido/i });
        fireEvent.click(resolveButton);

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/messages/t1/resolve');
            expect(toast.success).toHaveBeenCalledWith("Ticket resolvido com sucesso!");
            expect(api.get).toHaveBeenCalledWith('/messages/admin/all');
        });
    });

    it('deve mudar para aba de alertas e selecionar um alerta', async () => {
        renderComponent();
        
        const alertsTab = screen.getByRole('button', { name: /Avisos Emitidos/i });
        fireEvent.click(alertsTab);
        
        await waitFor(() => {
            expect(screen.getByText('Alerta 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Alerta 1').closest('button')!);
        
        // Verifica se o visualizador de broadcast mostra os detalhes
        expect(screen.getAllByText('Alerta 1').length).toBeGreaterThan(1); // Um na lista, um no detalhe
        expect(screen.getAllByText('Conteúdo Alerta').length).toBeGreaterThanOrEqual(1);
    });

    it('deve integrar com o modal de novo aviso e recarregar alertas após sucesso', async () => {
        renderComponent();
        
        fireEvent.click(screen.getByRole('button', { name: /Avisos Emitidos/i }));
        
        // Abre modal
        fireEvent.click(screen.getByRole('button', { name: /Disparar Novo Aviso/i }));
        
        expect(screen.getByText(/Disparar Aviso do Sistema/i)).toBeInTheDocument();
        
        // Simula sucesso no modal (onSuccess chamando loadAlerts)
        // Como o modal é um componente filho real agora, eu preencho e envio
        fireEvent.change(screen.getByRole('textbox', { name: /Assunto/i }), { target: { value: 'Broadcast Integração' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Conteúdo/i }), { target: { value: 'Testando fluxo completo.' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Disparar Aviso/i }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/admin/broadcast', expect.any(Object));
            // Verifica se o orquestrador recarregou alertas
            expect(api.get).toHaveBeenCalledWith('/messages/admin/alerts');
        });
    });

    it('deve lidar com erros de carregamento exibindo toasts', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url === '/messages/admin/all') return Promise.reject(new Error());
            return Promise.resolve({ data: [] });
        });

        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar a caixa de entrada.");
        });
    });
});
