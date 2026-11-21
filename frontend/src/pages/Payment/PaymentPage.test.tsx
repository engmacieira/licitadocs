import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentPage } from './index';
import { paymentService } from '../../services/paymentService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/payment', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste' },
        loading: false,
    }),
}));

vi.mock('../../services/paymentService', () => ({
    paymentService: {
        createCheckout: vi.fn(),
        getStatus: vi.fn(),
    },
}));

describe('PaymentPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a área de checkout e o formulário Infinite Pay', () => {
        render(<PaymentPage />);

        expect(screen.getByText('Pagamento Seguro')).toBeInTheDocument();
        expect(screen.getByText(/Redirecionamento Seguro para Infinite Pay/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Pagar com Infinite Pay/i })).toBeInTheDocument();
    });

    it('deve iniciar o checkout e redirecionar para a rota sandbox ao clicar no botão', async () => {
        vi.mocked(paymentService.createCheckout).mockResolvedValueOnce({
            checkout_url: '/payment/success?order_nsu=licita-1&mode=sandbox',
            order_nsu: 'licita-1',
            status: 'pending',
            mode: 'sandbox',
        });

        const user = userEvent.setup();
        render(<PaymentPage />);

        const payButton = screen.getByRole('button', { name: /Pagar com Infinite Pay/i });
        await user.click(payButton);

        await waitFor(() => {
            expect(paymentService.createCheckout).toHaveBeenCalledWith({
                company_id: '1',
                plan: 'PRO',
                billing_cycle: 'annual',
            });
            expect(mockNavigate).toHaveBeenCalledWith('/payment/success?order_nsu=licita-1&mode=sandbox');
        });
    });
});
