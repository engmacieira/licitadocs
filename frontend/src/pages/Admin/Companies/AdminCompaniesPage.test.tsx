import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminCompaniesPage } from './index';
import { companyService } from '../../../services/companyService';

// Mocks
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
    },
}));

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Admin Teste', role: 'admin' },
        loading: false,
        isAuthenticated: true,
    })
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

describe('AdminCompaniesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getAll as any).mockResolvedValue([
            {
                id: '1',
                razao_social: 'Empresa Alpha Ltda',
                cnpj: '11.111.111/0001-11',
                is_contract_signed: true,
                is_payment_active: true,
                is_admin_verified: true,
            },
            {
                id: '2',
                razao_social: 'Empresa Beta S.A.',
                cnpj: '22.222.222/0001-22',
                is_contract_signed: false,
                is_payment_active: false,
                is_admin_verified: false,
            },
        ]);
    });

    it('deve renderizar o título da carteira de clientes e a tabela de empresas', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <AdminCompaniesPage />
                </MemoryRouter>
            );
        });

        // Verifica o título principal (findBy para lidar com o loading)
        expect(await screen.findByText(/Carteira de Clientes/i)).toBeInTheDocument();
        
        // Verifica se as empresas do mock aparecem na tela
        expect(screen.getByText('Empresa Alpha Ltda')).toBeInTheDocument();
        expect(screen.getByText('Empresa Beta S.A.')).toBeInTheDocument();
        
        // Verifica a barra de pesquisa (placeholder do componente FilterBar)
        expect(screen.getByPlaceholderText(/Razão Social ou CNPJ/i)).toBeInTheDocument();
        
        // Verifica o botão de Nova Empresa
        expect(screen.getByText(/Nova Empresa/i)).toBeInTheDocument();
    });
});
