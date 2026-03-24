import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatWidget } from './index';
import userEvent from '@testing-library/user-event';
import { aiService } from '../../../../services/aiService';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../../../../services/aiService', () => ({
    aiService: {
        sendMessage: vi.fn(),
    },
}));

vi.mock('../../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

// Mock scrollIntoView as it's not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ChatWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render if user is not logged in', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null } as any);
        const { container } = render(<ChatWidget />);
        expect(container.firstChild).toBeNull();
    });

    it('does not render if user is an admin', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'admin' } } as any);
        const { container } = render(<ChatWidget />);
        expect(container.firstChild).toBeNull();
    });

    it('renders trigger button for clients', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);
        render(<ChatWidget />);
        expect(screen.getByLabelText(/Abrir Consultor IA/i)).toBeInTheDocument();
    });

    it('opens and closes the chat window', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);
        render(<ChatWidget />);

        const trigger = screen.getByLabelText(/Abrir Consultor IA/i);
        await user.click(trigger);

        expect(screen.getByText(/Assistente IA/i)).toBeInTheDocument();
        expect(screen.getByText(/Olá! Sou seu Consultor de Licitações/i)).toBeInTheDocument();

        // The close button inside the header doesn't have an aria-label, 
        // but the floating button becomes the close button when open.
        const closeTrigger = screen.getByLabelText(/Fechar chat/i);
        await user.click(closeTrigger);

        expect(screen.queryByText(/Assistente IA/i)).not.toBeInTheDocument();
    });

    it('sends a message and displays the response', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);
        vi.mocked(aiService.sendMessage).mockResolvedValueOnce({ response: 'Esta é uma resposta da IA.' });

        render(<ChatWidget />);
        await user.click(screen.getByLabelText(/Abrir Consultor IA/i));

        const input = screen.getByPlaceholderText(/Pergunte ao assistente.../i);
        await user.type(input, 'Olá, como você pode me ajudar?');
        
        // Find the send button (it's the only other button when open besides trigger and close)
        const sendButton = screen.getAllByRole('button').find(btn => btn.getAttribute('type') === 'submit');
        await user.click(sendButton!);

        expect(screen.getByText('Olá, como você pode me ajudar?')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(aiService.sendMessage).toHaveBeenCalledWith('Olá, como você pode me ajudar?');
            expect(screen.getByText('Esta é uma resposta da IA.')).toBeInTheDocument();
        });
    });

    it('handles API errors', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);
        vi.mocked(aiService.sendMessage).mockRejectedValueOnce(new Error('API Error'));

        render(<ChatWidget />);
        await user.click(screen.getByLabelText(/Abrir Consultor IA/i));

        const input = screen.getByPlaceholderText(/Pergunte ao assistente.../i);
        await user.type(input, 'Mensagem com erro');
        
        const sendButton = screen.getAllByRole('button').find(btn => btn.getAttribute('type') === 'submit');
        await user.click(sendButton!);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Assistente indisponível.");
            expect(screen.getByText(/Desculpe, tive um problema de conexão/i)).toBeInTheDocument();
        });
    });

    it('sends message when pressing Enter without Shift', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);
        vi.mocked(aiService.sendMessage).mockResolvedValueOnce({ response: 'Resposta via Enter' });

        render(<ChatWidget />);
        await user.click(screen.getByLabelText(/Abrir Consultor IA/i));

        const input = screen.getByPlaceholderText(/Pergunte ao assistente.../i);
        await user.type(input, 'Mensagem via Enter{Enter}');

        await waitFor(() => {
            expect(aiService.sendMessage).toHaveBeenCalledWith('Mensagem via Enter');
            expect(screen.getByText('Resposta via Enter')).toBeInTheDocument();
        });
    });

    it('does not send message when pressing Shift+Enter', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'client' } } as any);

        render(<ChatWidget />);
        await user.click(screen.getByLabelText(/Abrir Consultor IA/i));

        const input = screen.getByPlaceholderText(/Pergunte ao assistente.../i) as HTMLTextAreaElement;
        
        // Simular Shift+Enter manually to ensure JSDOM handles it
        await user.type(input, 'Linha 1');
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        await user.type(input, 'Linha 2');

        expect(aiService.sendMessage).not.toHaveBeenCalled();
        // Just check if it's not empty and contains the parts
        expect(input.value).toMatch(/Linha 1/);
        expect(input.value).toMatch(/Linha 2/);
    });
});
