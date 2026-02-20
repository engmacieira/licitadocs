import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PaymentPage } from './index';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/api', () => ({ default: { patch: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { legalName: 'Empresa Beta', responsibleName: 'Admin Teste' } }),
    };
});

describe('PaymentPage Integration', () => {
    const mockCompany = { id: 'comp-456', razao_social: 'Empresa Beta' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCompany });
        // Ativamos o relógio falso padrão de forma limpa
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Restauramos o relógio
        vi.useRealTimers();
    });

    it('deve processar o pagamento com sucesso e navegar para o Dashboard', async () => {
        (api.patch as any).mockResolvedValueOnce({ data: {} });

        render(
            <MemoryRouter><PaymentPage /></MemoryRouter>
        );

        const confirmBtn = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });

        // 1. Clicamos no botão
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        // 2. Avançamos 2 segundos exatos (Processamento Bancário)
        await act(async () => {
            vi.advanceTimersByTime(2000);
            await Promise.resolve(); // Garante que a promessa da API foi resolvida
        });

        // Sem waitFor! O estado já foi atualizado instantaneamente!
        expect(api.patch).toHaveBeenCalledWith('/companies/comp-456/onboarding-step?step=payment');
        expect(screen.getByText('Tudo Pronto!')).toBeInTheDocument();

        // 3. Avançamos mais 3 segundos (Redirecionamento)
        await act(async () => {
            vi.advanceTimersByTime(3000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('deve exibir toast de erro se a chamada à API falhar', async () => {
        (api.patch as any).mockRejectedValueOnce(new Error('Falha'));

        render(
            <MemoryRouter><PaymentPage /></MemoryRouter>
        );

        const confirmBtn = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });

        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        // Avançamos os 2 segundos
        await act(async () => {
            vi.advanceTimersByTime(2000);
            await Promise.resolve();
        });

        // Sem waitFor! A validação é imediata.
        expect(toast.error).toHaveBeenCalledWith("Falha no pagamento", expect.any(Object));
        expect(screen.getByText('Confirmar e Ativar Conta')).toBeInTheDocument();
    });

    it('deve renderizar o resumo do pedido corretamente', () => {
        render(
            <MemoryRouter><PaymentPage /></MemoryRouter>
        );
        expect(screen.getByText('LicitaDoc Business')).toBeInTheDocument();
        expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });

    it('deve bloquear o pagamento se a sessão da empresa não for encontrada', async () => {
        (useAuth as any).mockReturnValue({ currentCompany: null });

        render(
            <MemoryRouter><PaymentPage /></MemoryRouter>
        );

        const confirmBtn = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });

        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(toast.error).toHaveBeenCalledWith("Sessão expirada", expect.any(Object));
        expect(api.patch).not.toHaveBeenCalled();
    });
});