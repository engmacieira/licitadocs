import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentOrchestrator } from './PaymentOrchestrator';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';

// Mocks
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});

vi.mock('../../services/api', () => ({
    default: {
        patch: vi.fn()
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('PaymentOrchestrator Integration', () => {

    const mockLocation = {
        state: {
            legalName: 'Empresa do Location',
            responsibleName: 'Responsavel do Location'
        }
    };
    const mockCompany = {
        id: 'company-123',
        razao_social: 'Empresa do Contexto',
        responsavel_nome: 'Responsavel do Contexto'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useLocation as any).mockReturnValue(mockLocation);
        (useAuth as any).mockReturnValue({
            currentCompany: mockCompany
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render initial state with OrderSummary and MockPaymentForm', () => {
        render(<PaymentOrchestrator />);
        
        expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
        expect(screen.getByText('Dados de Pagamento')).toBeInTheDocument();
        // Should use company name from context as priority
        const cardHolderInput = screen.getByLabelText(/Nome no Cartão/i);
        expect(cardHolderInput).toHaveValue('RESPONSAVEL DO CONTEXTO');
    });

    it('should use location state if context is missing names', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: { id: 'company-123' }
        });
        
        render(<PaymentOrchestrator />);
        
        const cardHolderInput = screen.getByLabelText(/Nome no Cartão/i);
        expect(cardHolderInput).toHaveValue('RESPONSAVEL DO LOCATION');
    });

    it('should handle successful payment flow', async () => {
        (api.patch as any).mockResolvedValueOnce({ data: {} });
        
        render(<PaymentOrchestrator />);
        
        const paymentButton = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });
        fireEvent.click(paymentButton);
        
        // Should be in processing state
        expect(screen.getByText('Processando...')).toBeInTheDocument();
        
        // 1. Advance timers for Gateway simulation (2000ms)
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        
        // 2. API should have been called
        expect(api.patch).toHaveBeenCalledWith('/companies/company-123/onboarding-step?step=payment');
        
        // 3. Success screen should be visible
        expect(screen.getByText('Tudo Pronto!')).toBeInTheDocument();
        expect(screen.getByText(/Empresa do Contexto/)).toBeInTheDocument();
        expect(toast.success).toHaveBeenCalledWith('Pagamento confirmado!', expect.any(Object));
        
        // 4. Advance timers for final redirect (3000ms)
        await act(async () => {
            vi.advanceTimersByTime(3000);
        });
        
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle payment failure', async () => {
        (api.patch as any).mockRejectedValueOnce(new Error('API Error'));
        
        render(<PaymentOrchestrator />);
        
        const paymentButton = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });
        fireEvent.click(paymentButton);
        
        // Advance timers for Gateway simulation
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        
        // Should show error toast
        expect(toast.error).toHaveBeenCalledWith('Falha no pagamento', expect.any(Object));
        
        // Should reset processing state
        expect(screen.getByRole('button', { name: /Confirmar e Ativar Conta/i })).toBeInTheDocument();
        expect(screen.queryByText('Processando...')).not.toBeInTheDocument();
    });

    it('should show error if currentCompany is missing when attempting payment', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: null
        });
        
        render(<PaymentOrchestrator />);
        
        const paymentButton = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });
        fireEvent.click(paymentButton);
        
        expect(toast.error).toHaveBeenCalledWith('Sessão expirada', expect.any(Object));
        expect(api.patch).not.toHaveBeenCalled();
    });
});
