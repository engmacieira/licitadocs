import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { NewBroadcastModal } from './NewBroadcastModal';
import api from '../../../services/api';
import { toast } from 'sonner';

// Mock do módulo de API
vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
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

describe('NewBroadcastModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn()
    };

    const mockCompanies = [
        { id: 'c1', razao_social: 'Empresa A' },
        { id: 'c2', razao_social: 'Empresa B' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue({ data: mockCompanies });
        (api.post as any).mockResolvedValue({ data: {} });
    });

    it('não deve renderizar se isOpen for falso', () => {
        const { container } = render(<NewBroadcastModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('deve exibir erros de validação se campos estiverem vazios', async () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        const submitButton = screen.getByRole('button', { name: /Disparar Aviso/i });
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Preencha o assunto e a mensagem.");
    });

    it('deve carregar empresas ao selecionar a opção de escolher empresas específicas', async () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        const specificRadio = screen.getByLabelText('Selecionar Específicas');
        fireEvent.click(specificRadio);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/companies');
            expect(screen.getByText('Empresa A')).toBeInTheDocument();
            expect(screen.getByText('Empresa B')).toBeInTheDocument();
        });
    });

    it('deve validar se nenhuma empresa foi selecionada no modo específico', async () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        // Preenche campos obrigatórios
        fireEvent.change(screen.getByRole('textbox', { name: /Assunto/i }), { target: { value: 'Assunto Teste' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Conteúdo/i }), { target: { value: 'Mensagem Teste' } });

        // Muda para específico
        fireEvent.click(screen.getByLabelText('Selecionar Específicas'));
        
        const submitButton = screen.getByRole('button', { name: /Disparar Aviso/i });
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Selecione pelo menos uma empresa destinatária.");
    });

    it('deve disparar o envio para todas as empresas com sucesso', async () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        fireEvent.change(screen.getByRole('textbox', { name: /Assunto/i }), { target: { value: 'Comunicado Geral' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Conteúdo/i }), { target: { value: 'Mensagem para todos.' } });

        const submitButton = screen.getByRole('button', { name: /Disparar Aviso/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/admin/broadcast', {
                subject: 'Comunicado Geral',
                content: 'Mensagem para todos.',
                send_to_all: true,
                company_ids: []
            });
            expect(toast.success).toHaveBeenCalledWith("Aviso enviado com sucesso!", expect.any(Object));
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('deve disparar o envio para empresas específicas com sucesso', async () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        fireEvent.change(screen.getByRole('textbox', { name: /Assunto/i }), { target: { value: 'Aviso Específico' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Conteúdo/i }), { target: { value: 'Conteúdo restrito.' } });

        // Selecionar empresas
        fireEvent.click(screen.getByLabelText('Selecionar Específicas'));
        await waitFor(() => screen.getByText('Empresa A'));
        
        fireEvent.click(screen.getByLabelText('Empresa A'));

        const submitButton = screen.getByRole('button', { name: /Disparar Aviso/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/messages/admin/broadcast', {
                subject: 'Aviso Específico',
                content: 'Conteúdo restrito.',
                send_to_all: false,
                company_ids: ['c1']
            });
        });
    });

    it('deve exibir erro se a chamada de API falhar', async () => {
        (api.post as any).mockRejectedValue(new Error('Falha no servidor'));
        render(<NewBroadcastModal {...defaultProps} />);
        
        fireEvent.change(screen.getByRole('textbox', { name: /Assunto/i }), { target: { value: 'Assunto' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Conteúdo/i }), { target: { value: 'Conteúdo' } });

        fireEvent.click(screen.getByRole('button', { name: /Disparar Aviso/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao enviar o aviso.", expect.any(Object));
        });
    });

    it('deve fechar o modal ao clicar em Cancelar', () => {
        render(<NewBroadcastModal {...defaultProps} />);
        
        fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
