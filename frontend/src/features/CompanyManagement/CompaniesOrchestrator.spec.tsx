import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CompaniesOrchestrator } from './CompaniesOrchestrator';
import { companyService } from '../../services/companyService';
import { toast } from 'sonner';

// Mocking services and hooks
vi.mock('../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('CompaniesOrchestrator Component', () => {
    const mockCompanies = [
        {
            id: '1',
            razao_social: 'Alpha Corp',
            cnpj: '11111111111111',
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true,
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: '2',
            razao_social: 'Beta Solutions',
            cnpj: '22222222222222',
            is_contract_signed: true,
            is_payment_active: false,
            is_admin_verified: false,
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: '3',
            razao_social: '', // Empty to test fallback to 'name' in component
            name: 'Gamma Tech',
            cnpj: '33333333333333',
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true,
            is_active: true,
            created_at: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show loading state initially and then render companies', async () => {
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        // Should show enough skeletons or at least the table is not there yet
        expect(screen.queryByRole('table')).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
            expect(screen.getByText('Beta Solutions')).toBeInTheDocument();
            expect(screen.getByText('Gamma Tech')).toBeInTheDocument();
        });

        expect(companyService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should show toast error when API call fails', async () => {
        vi.mocked(companyService.getAll).mockRejectedValue(new Error('API Error'));

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar lista de empresas.");
        });
    });

    it('should filter companies by search term (Razão Social)', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/buscar por razão social ou cnpj/i);
        await user.type(searchInput, 'Alpha');

        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
        expect(screen.queryByText('Beta Solutions')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Tech')).not.toBeInTheDocument();
    });

    it('should filter companies by search term (CNPJ)', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('11111111111111')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/buscar por razão social ou cnpj/i);
        await user.type(searchInput, '22222');

        expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
        expect(screen.getByText('Beta Solutions')).toBeInTheDocument();
    });

    it('should filter companies by "Regulares" status', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

        const regularButton = screen.getByRole('button', { name: /regulares/i });
        await user.click(regularButton);

        expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
        expect(screen.getByText('Gamma Tech')).toBeInTheDocument();
        expect(screen.queryByText('Beta Solutions')).not.toBeInTheDocument();
    });

    it('should filter companies by "Com Pendências" status', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Alpha Corp')).toBeInTheDocument());

        const pendingButton = screen.getByRole('button', { name: /com pendências/i });
        await user.click(pendingButton);

        expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Tech')).not.toBeInTheDocument();
        expect(screen.getByText('Beta Solutions')).toBeInTheDocument();
    });

    it('should navigate to /register when "Nova Empresa" is clicked', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.getAll).mockResolvedValue(mockCompanies);

        render(
            <MemoryRouter>
                <CompaniesOrchestrator />
            </MemoryRouter>
        );

        const newCompanyButton = screen.getByRole('button', { name: /nova empresa/i });
        await user.click(newCompanyButton);

        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
});
