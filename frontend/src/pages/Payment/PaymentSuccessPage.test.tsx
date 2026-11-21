import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PaymentSuccessPage } from './Success';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

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

function renderSuccessPage(initialEntry = '/payment/success?order_nsu=licita-123&mode=sandbox') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('PaymentSuccessPage', () => {
    const mockReloadContext = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            currentCompany: {
                id: 'comp-123',
                razao_social: 'Empresa Teste LTDA',
                cnpj: '00.000.000/0001-00',
                role: 'MASTER',
                status: true,
                created_at: '2026-01-01T00:00:00Z',
            },
            loading: false,
            reloadContext: mockReloadContext,
        } as unknown as ReturnType<typeof useAuth>);
    });

    it('deve exibir estado de carregamento enquanto verifica o pagamento', () => {
        vi.mocked(paymentService.getStatus).mockReturnValueOnce(new Promise(() => {}));

        renderSuccessPage();

        expect(screen.getByText('Verificando pagamento...')).toBeInTheDocument();
        expect(screen.getByText(/Pedido: licita-123/i)).toBeInTheDocument();
    });

    it('deve exibir confirmação e link para comprovante quando is_payment_active for true', async () => {
        vi.mocked(paymentService.getStatus).mockResolvedValueOnce({
            company_id: 'comp-123',
            is_payment_active: true,
            subscription_status: 'active',
            subscription_plan: 'PRO',
        });

        renderSuccessPage(
            '/payment/success?order_nsu=licita-123&receipt_url=https://infinitepay.io/receipt/1'
        );

        await waitFor(() => {
            expect(screen.getByText('Tudo Pronto!')).toBeInTheDocument();
        });

        expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
        const receiptLink = screen.getByRole('link', { name: /Ver Comprovante/i });
        expect(receiptLink).toHaveAttribute('href', 'https://infinitepay.io/receipt/1');

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Ir para o Dashboard/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('deve exibir estado pendente com botão "Verificar novamente" quando is_payment_active for false', async () => {
        vi.mocked(paymentService.getStatus)
            .mockResolvedValueOnce({
                company_id: 'comp-123',
                is_payment_active: false,
                subscription_status: 'pending',
            })
            .mockResolvedValueOnce({
                company_id: 'comp-123',
                is_payment_active: true,
                subscription_status: 'active',
            });

        renderSuccessPage();

        await waitFor(() => {
            expect(screen.getByText('Pagamento em processamento')).toBeInTheDocument();
        });

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Verificar novamente/i }));

        await waitFor(() => {
            expect(screen.getByText('Tudo Pronto!')).toBeInTheDocument();
        });
        expect(paymentService.getStatus).toHaveBeenCalledTimes(2);
    });

    it('deve exibir estado de erro quando a verificação falhar e permitir voltar para /payment', async () => {
        vi.mocked(paymentService.getStatus).mockRejectedValueOnce(new Error('Network error'));

        renderSuccessPage();

        await waitFor(() => {
            expect(screen.getByText('Não foi possível confirmar')).toBeInTheDocument();
        });

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Voltar para Pagamento/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/payment');
    });
});
