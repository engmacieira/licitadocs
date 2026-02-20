import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminCompaniesPage } from './index';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Dados falsos de empresas
const mockCompanies = [
    {
        id: 'comp-1',
        razao_social: 'Empresa Alpha Regular',
        cnpj: '11111111000111',
        email_corporativo: 'alpha@teste.com',
        is_contract_signed: true,
        is_payment_active: true,
        is_admin_verified: true, // Status: Regular
    },
    {
        id: 'comp-2',
        razao_social: 'Empresa Beta Pendente Doc',
        cnpj: '22222222000122',
        email_corporativo: 'beta@teste.com',
        is_contract_signed: true,
        is_payment_active: true,
        is_admin_verified: false, // Status: Validar Docs
    },
    {
        id: 'comp-3',
        razao_social: 'Empresa Gamma Inadimplente',
        cnpj: '33333333000133',
        email_corporativo: 'gamma@teste.com',
        is_contract_signed: true,
        is_payment_active: false, // Status: Pagamento
        is_admin_verified: true,
    },
];

describe('AdminCompaniesPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve carregar e renderizar a lista de empresas com seus badges corretos', async () => {
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        render(
            <MemoryRouter>
                <AdminCompaniesPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Carteira de Clientes')).toBeInTheDocument();

        await waitFor(() => {
            // Verifica a presença das empresas
            expect(screen.getByText('Empresa Alpha Regular')).toBeInTheDocument();
            expect(screen.getByText('Empresa Beta Pendente Doc')).toBeInTheDocument();

            // Verifica os badges de status correspondentes
            expect(screen.getByText('Regular')).toBeInTheDocument();
            expect(screen.getByText('Validar Docs')).toBeInTheDocument();
            expect(screen.getByText('Pagamento')).toBeInTheDocument();
        });
    });

    it('deve filtrar as empresas pela barra de pesquisa', async () => {
        const user = userEvent.setup();
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        render(
            <MemoryRouter>
                <AdminCompaniesPage />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Empresa Alpha Regular')).toBeInTheDocument());

        // Pesquisa por CNPJ
        const searchInput = screen.getByPlaceholderText(/Buscar por Razão Social ou CNPJ/i);
        await user.type(searchInput, '22222222000122');

        expect(screen.queryByText('Empresa Alpha Regular')).not.toBeInTheDocument();
        expect(screen.getByText('Empresa Beta Pendente Doc')).toBeInTheDocument();
    });

    it('deve filtrar as empresas pelos botões de status (Pendentes / Regulares)', async () => {
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        render(
            <MemoryRouter>
                <AdminCompaniesPage />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Empresa Alpha Regular')).toBeInTheDocument());

        // Clica em "Com Pendências"
        fireEvent.click(screen.getByRole('button', { name: 'Com Pendências' }));

        expect(screen.queryByText('Empresa Alpha Regular')).not.toBeInTheDocument(); // É regular
        expect(screen.getByText('Empresa Beta Pendente Doc')).toBeInTheDocument(); // Pendente Docs
        expect(screen.getByText('Empresa Gamma Inadimplente')).toBeInTheDocument(); // Pendente Pagamento

        // Clica em "Regulares"
        fireEvent.click(screen.getByRole('button', { name: 'Regulares' }));

        expect(screen.getByText('Empresa Alpha Regular')).toBeInTheDocument();
        expect(screen.queryByText('Empresa Beta Pendente Doc')).not.toBeInTheDocument();
    });

    it('deve navegar para a página de detalhes ao clicar em Gerenciar', async () => {
        const user = userEvent.setup();
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        render(
            <MemoryRouter>
                <AdminCompaniesPage />
            </MemoryRouter>
        );

        // 1. Aguardamos a tabela carregar e a empresa aparecer na tela
        await waitFor(() => {
            expect(screen.getByText('Empresa Alpha Regular')).toBeInTheDocument();
        });

        // 2. AGORA SIM, pegamos o botão e clicamos (com await e fora do waitFor)
        const btnsGerenciar = screen.getAllByRole('button', { name: 'Gerenciar' });
        await user.click(btnsGerenciar[0]);

        // 3. Verificamos se a navegação aconteceu para o ID correto
        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies/comp-1');
    });
});