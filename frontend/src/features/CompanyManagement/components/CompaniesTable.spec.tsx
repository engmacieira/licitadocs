import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CompaniesTable } from './CompaniesTable';



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

describe('CompaniesTable Component', () => {
    const mockCompanies = [
        {
            id: '1',
            razao_social: 'Empresa Regular',
            cnpj: '12.345.678/0001-90',
            email_corporativo: 'regular@teste.com',
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true,
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: '2',
            razao_social: 'Empresa Pendente Docs',
            cnpj: '98.765.432/0001-21',
            email_corporativo: 'docs@teste.com',
            is_contract_signed: true,
            is_payment_active: false,
            is_admin_verified: false,
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: '3',
            razao_social: 'Empresa Pendente Pagamento',
            cnpj: '11.222.333/0001-44',
            email_corporativo: 'pagamento@teste.com',
            is_contract_signed: true,
            is_payment_active: false,
            is_admin_verified: true,
            is_active: true,
            created_at: new Date().toISOString(),
        },
    ];

    it('should render loading state (skeletons)', () => {
        const { container } = render(
            <MemoryRouter>
                <CompaniesTable companies={[]} loading={true} />
            </MemoryRouter>
        );

        // Should not render the table
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        // Should render skeleton structures (based on the component's div structure)
        const loadingContainer = container.querySelector('.p-6.space-y-4');
        expect(loadingContainer).toBeInTheDocument();
    });

    it('should render empty state message when no companies', () => {
        render(
            <MemoryRouter>
                <CompaniesTable companies={[]} loading={false} />
            </MemoryRouter>
        );

        expect(screen.getByText(/nenhuma empresa encontrada/i)).toBeInTheDocument();
    });

    it('should render the list of companies correctly', () => {
        render(
            <MemoryRouter>
                <CompaniesTable companies={mockCompanies} loading={false} />
            </MemoryRouter>
        );

        expect(screen.getByText('Empresa Regular')).toBeInTheDocument();
        expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
        
        expect(screen.getByText('Empresa Pendente Docs')).toBeInTheDocument();
        expect(screen.getByText('Empresa Pendente Pagamento')).toBeInTheDocument();
    });

    it('should render the correct status badges', () => {
        render(
            <MemoryRouter>
                <CompaniesTable companies={mockCompanies} loading={false} />
            </MemoryRouter>
        );

        // Regular (Checking for the exact text contained in the badge)
        expect(screen.getByText('Regular')).toBeInTheDocument();

        // Validar Docs (Checking for the exact text contained in the badge)
        expect(screen.getByText('Validar Docs')).toBeInTheDocument();

        // Pagamento (Checking for the exact text contained in the badge)
        // Note: There might be multiple "Pagamento" if the StepDot title also contains it.
        // Let's use exact string match 'Pagamento' which won't match 'Pagamento: Pendente'
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
    });

    it('should navigate to the correct URL when "Gerenciar" is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <CompaniesTable companies={[mockCompanies[0]]} loading={false} />
            </MemoryRouter>
        );

        const manageButton = screen.getByRole('button', { name: /gerenciar/i });
        await user.click(manageButton);

        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies/1');
    });

    /**
     * CENÁRIO DE ESTRESSE: Heavy Load
     * Verifica como o componente lida com uma quantidade massiva de dados.
     * Como o componente usa .map() simples, esperamos que ele renderize todas as 5.000 linhas,
     * o que evidencia a falta de virtualização.
     */
    it('STRESS: should handle massive api returns (5,000 items)', () => {
        const massiveData = Array.from({ length: 5000 }, (_, i) => ({
            id: `${i}`,
            razao_social: `Empresa ${i}`,
            cnpj: '00.000.000/0001-00',
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true,
        }));

        const { container } = render(
            <MemoryRouter>
                <CompaniesTable companies={massiveData} loading={false} />
            </MemoryRouter>
        );

        // Verifica se apenas a primeira página (20 itens) foi renderizada no DOM, 
        // confirmando a correção do estresse de renderização via paginação.
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(20);

        // Verifica se os controles de paginação estão visíveis. 
        // Usamos matchers parciais para evitar problemas com quebra de elementos (spans).
        expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
        expect(screen.getByText(/5000/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Próximo/i })).toBeInTheDocument();
    });
});
