import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentOrchestrator } from './PaymentOrchestrator';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { toast } from 'sonner';

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useLocation: vi.fn(),
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/paymentService', () => ({
    paymentService: {
        createCheckout: vi.fn(),
        getStatus: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('PaymentOrchestrator Integration', () => {
    const mockNavigate = vi.fn();
    const mockLocationAssign = vi.fn();

    const mockLocation = {
        pathname: '/payment',
        search: '',
        hash: '',
        key: 'default',
        state: {
            legalName: 'Empresa do Location',
            responsibleName: 'Responsavel do Location',
        },
    };

    const mockCompany = {
        id: 'company-123',
        razao_social: 'Empresa do Contexto',
        responsavel_nome: 'Responsavel do Contexto',
        cnpj: '00.000.000/0001-00',
        role: 'MASTER' as const,
        status: true,
        created_at: '2026-01-01T00:00:00Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('location', { assign: mockLocationAssign });

        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useLocation).mockReturnValue(mockLocation);
        vi.mocked(useAuth).mockReturnValue({
            currentCompany: mockCompany,
            loading: false,
        } as unknown as ReturnType<typeof useAuth>);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should render OrderSummary and InfinitePayCheckoutForm with company info from context', () => {
        render(<PaymentOrchestrator />);

        expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
        expect(screen.getByText('Pagamento Seguro')).toBeInTheDocument();
        expect(screen.getByText('Empresa do Contexto')).toBeInTheDocument();
        expect(screen.getByText('Responsavel do Contexto')).toBeInTheDocument();
    });

    it('should fallback to location state if context company lacks names', () => {
        vi.mocked(useAuth).mockReturnValue({
            currentCompany: {
                id: 'company-123',
                razao_social: '',
                cnpj: '00.000.000/0001-00',
                role: 'MASTER',
                status: true,
                created_at: '2026-01-01T00:00:00Z',
            },
            loading: false,
        } as unknown as ReturnType<typeof useAuth>);

        render(<PaymentOrchestrator />);

        expect(screen.getByText('Empresa do Location')).toBeInTheDocument();
        expect(screen.getByText('Responsavel do Location')).toBeInTheDocument();
    });

    it('should redirect externally when checkout_url is an http/https URL', async () => {
        vi.mocked(paymentService.createCheckout).mockResolvedValueOnce({
            checkout_url: 'https://checkout.infinitepay.io/invoice/123',
            order_nsu: 'licita-123',
            status: 'pending',
            mode: 'infinitepay',
        });

        render(<PaymentOrchestrator />);

        const paymentButton = screen.getByRole('button', { name: /Pagar com Infinite Pay/i });
        fireEvent.click(paymentButton);

        expect(screen.getByText('Gerando checkout...')).toBeInTheDocument();

        await waitFor(() => {
            expect(paymentService.createCheckout).toHaveBeenCalledWith({
                company_id: 'company-123',
                plan: 'PRO',
                billing_cycle: 'annual',
            });
            expect(mockLocationAssign).toHaveBeenCalledWith('https://checkout.infinitepay.io/invoice/123');
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should navigate internally when checkout_url is a relative sandbox URL', async () => {
        vi.mocked(paymentService.createCheckout).mockResolvedValueOnce({
            checkout_url: '/payment/success?order_nsu=licita-123&mode=sandbox',
            order_nsu: 'licita-123',
            status: 'pending',
            mode: 'sandbox',
        });

        render(<PaymentOrchestrator />);

        const paymentButton = screen.getByRole('button', { name: /Pagar com Infinite Pay/i });
        fireEvent.click(paymentButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/payment/success?order_nsu=licita-123&mode=sandbox');
        });
        expect(mockLocationAssign).not.toHaveBeenCalled();
    });

    it('should show error toast and reset loading state when checkout creation fails', async () => {
        vi.mocked(paymentService.createCheckout).mockRejectedValueOnce(new Error('API Error'));

        render(<PaymentOrchestrator />);

        const paymentButton = screen.getByRole('button', { name: /Pagar com Infinite Pay/i });
        fireEvent.click(paymentButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Falha ao iniciar pagamento', expect.any(Object));
        });

        expect(screen.getByRole('button', { name: /Pagar com Infinite Pay/i })).toBeInTheDocument();
        expect(screen.queryByText('Gerando checkout...')).not.toBeInTheDocument();
    });

    it('should show session expired error if currentCompany is missing', () => {
        vi.mocked(useAuth).mockReturnValue({
            currentCompany: null,
            loading: false,
        } as unknown as ReturnType<typeof useAuth>);

        render(<PaymentOrchestrator />);

        const paymentButton = screen.getByRole('button', { name: /Pagar com Infinite Pay/i });
        fireEvent.click(paymentButton);

        expect(toast.error).toHaveBeenCalledWith('Sessão expirada', expect.any(Object));
        expect(paymentService.createCheckout).not.toHaveBeenCalled();
    });
});
