import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard as ClientDashboardPage } from './index';

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
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda' },
        isAuthenticated: true
    })
}));

// Mock dos serviços
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getById: vi.fn().mockResolvedValue({
            id: '1',
            razao_social: 'Empresa Teste Ltda',
            is_terms_accepted: true,
            is_data_completed: true,
            is_payment_active: true,
            is_contract_signed: true,
            is_admin_verified: true
        })
    }
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn().mockResolvedValue([
            { id: '101', status: 'valid', created_at: new Date().toISOString() }
        ])
    }
}));

describe('ClientDashboardPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o resumo do cofre e KPIs do cliente', async () => {
        render(<ClientDashboardPage />);

        // Aguarda o carregamento dos dados
        await waitFor(() => {
            expect(screen.getByText('Resumo do Cofre')).toBeInTheDocument();
        });

        // Verifica o nome da empresa e o status de monitoramento
        expect(screen.getByText('Empresa Teste Ltda')).toBeInTheDocument();
        expect(screen.getByText(/Monitoramento Ativo/i)).toBeInTheDocument();

        // Verifica os StatsCards
        expect(screen.getByText('Total no Cofre')).toBeInTheDocument();
        expect(screen.getByText('Regulares')).toBeInTheDocument();
        expect(screen.getByText('Saúde Fiscal')).toBeInTheDocument();
    });

    it('deve navegar para Gerar Declarações ao clicar no botão correspondente', async () => {
        const user = userEvent.setup();
        render(<ClientDashboardPage />);

        const templateButton = await screen.findByRole('button', { name: /Gerar Declarações/i });
        await user.click(templateButton);

        expect(navigate).toHaveBeenCalledWith('/document-templates');
    });
});
