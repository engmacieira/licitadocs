import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatWidget } from './index'; // Importa o componente que está na mesma pasta
import { aiService } from '../../services/aiService'; // Caminho real que o seu index.tsx usa
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKING (DUBLÊS DE TESTE)
// ==========================================
// "Sequestramos" a API para não gastarmos tokens do Gemini no Vitest
vi.mock('../../services/aiService', () => ({
    aiService: {
        sendMessage: vi.fn(),
    },
}));

// "Sequestramos" o Sonner para conseguirmos verificar se ele foi chamado
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

describe('ChatWidget Component', () => {
    // SETUP: Roda antes de cada um dos `it`
    beforeEach(() => {
        // O JSDOM (navegador falso do teste) não sabe fazer scroll de ecrã.
        // Se não "fingirmos" esta função, o seu useEffect vai estourar um erro!
        window.HTMLElement.prototype.scrollIntoView = vi.fn();

        // Limpamos o histórico de chamadas da API falsa
        vi.clearAllMocks();
    });

    it('deve renderizar fechado e abrir ao clicar no botão flutuante', async () => {
        const user = userEvent.setup();
        render(<ChatWidget />);

        // O chat não deve estar visível no início
        expect(screen.queryByText('Concierge IA')).not.toBeInTheDocument();

        // Clica no botão flutuante
        const triggerButton = screen.getByLabelText('Abrir chat');
        await user.click(triggerButton);

        // O painel deve abrir e mostrar a mensagem de boas-vindas
        expect(screen.getByText('Concierge IA')).toBeInTheDocument();
        expect(screen.getByText(/Sou seu Concierge Virtual/i)).toBeInTheDocument();
    });

    it('deve enviar uma mensagem e exibir a resposta da IA (Caminho Feliz)', async () => {
        const user = userEvent.setup();

        // Preparamos a nossa API falsa para devolver sucesso
        (aiService.sendMessage as any).mockResolvedValueOnce({
            response: 'A licitação é um processo administrativo...'
        });

        render(<ChatWidget />);

        // Abre o chat
        await user.click(screen.getByLabelText('Abrir chat'));

        // Digita e envia a dúvida
        const input = screen.getByPlaceholderText('Digite sua dúvida...');
        await user.type(input, 'O que é licitação?');
        await user.click(screen.getByLabelText('Enviar mensagem'));

        // Validação da Optimistic UI: A mensagem do usuário tem de aparecer na hora
        expect(screen.getByText('O que é licitação?')).toBeInTheDocument();
        // O input tem de ser limpo imediatamente
        expect(input).toHaveValue('');

        // waitFor: Esperamos que o React resolva a Promessa da API falsa e atualize o ecrã
        await waitFor(() => {
            expect(screen.getByText('A licitação é um processo administrativo...')).toBeInTheDocument();
        });

        // Garantimos que o chat realmente tentou ligar para o Backend
        expect(aiService.sendMessage).toHaveBeenCalledWith('O que é licitação?');
    });

    it('deve lidar com erros da API e exibir toast (Caminho Triste)', async () => {
        const user = userEvent.setup();

        // Preparamos a API falsa para simular uma queda de internet
        (aiService.sendMessage as any).mockRejectedValueOnce(new Error('Network Error'));

        render(<ChatWidget />);

        await user.click(screen.getByLabelText('Abrir chat'));
        await user.type(screen.getByPlaceholderText('Digite sua dúvida...'), 'Tem alguém aí?');
        await user.click(screen.getByLabelText('Enviar mensagem'));

        await waitFor(() => {
            // Verifica se a mensagem vermelha inline apareceu no chat
            expect(screen.getByText(/Erro de conexão. Por favor, tente novamente./i)).toBeInTheDocument();
            // Verifica se o Toast (Notificação) da Sonner disparou no canto do ecrã
            expect(toast.error).toHaveBeenCalledWith('Concierge indisponível.', expect.any(Object));
        });
    });

    it('deve desabilitar o botão de envio se o input estiver vazio', async () => {
        const user = userEvent.setup();
        render(<ChatWidget />);

        await user.click(screen.getByLabelText('Abrir chat'));

        const sendButton = screen.getByLabelText('Enviar mensagem');
        const input = screen.getByPlaceholderText('Digite sua dúvida...');

        // Início: Vazio = Botão Desabilitado
        expect(sendButton).toBeDisabled();

        // Com texto = Botão Habilitado
        await user.type(input, 'a');
        expect(sendButton).not.toBeDisabled();

        // Apagou o texto = Botão Desabilitado novamente
        await user.clear(input);
        expect(sendButton).toBeDisabled();
    });
});