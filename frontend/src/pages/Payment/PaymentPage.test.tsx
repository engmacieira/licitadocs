import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentPage } from './index';

// Mock do react-router-dom


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
const navigate = mockNavigate;

// Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste' }
    })
}));

// Mock do serviço de API
vi.mock('../../services/api', () => ({
    default: {
        patch: vi.fn().mockResolvedValue({})
    }
}));

describe('PaymentPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a área de checkout e o formulário de pagamento', () => {
        render(<PaymentPage />);

        // Verifica elementos do checkout (OrderSummary e MockPaymentForm)
        expect(screen.getByText('Dados de Pagamento')).toBeInTheDocument();
        expect(screen.getByText(/Ambiente de Teste Seguro/i)).toBeInTheDocument();

        // Verifica o botão de ativação
        expect(screen.getByRole('button', { name: /Confirmar e Ativar Conta/i })).toBeInTheDocument();
    });

    it('deve processar o pagamento e mostrar sucesso ao clicar no botão', async () => {
        const user = userEvent.setup();
        render(<PaymentPage />);

        const payButton = screen.getByRole('button', { name: /Confirmar e Ativar Conta/i });
        await user.click(payButton);

        // Verifica se entra em estado de processamento (mockado por 2s no orchestrator, mas o componente mostra o texto)
        expect(screen.getByText(/Processando.../i)).toBeInTheDocument();

        // Aguarda a mensagem de sucesso (configurada para 2s de delay no orchestrator)
        await waitFor(() => {
            expect(screen.getByText(/Tudo Pronto!/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        expect(screen.getByText(/está ativa/i)).toBeInTheDocument();
    });
});
