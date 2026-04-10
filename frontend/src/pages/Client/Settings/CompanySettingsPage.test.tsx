import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CompanySettingsPage } from './index';

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

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', role: 'client' },
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda', cnpj: '12.345.678/0001-90' }
    })
}));

// Mock dos serviços
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getById: vi.fn().mockResolvedValue({
            id: '1',
            razao_social: 'Empresa Teste Ltda',
            cnpj: '12.345.678/0001-90',
            is_data_completed: true
        }),
        getTeam: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn().mockImplementation((url) => {
            if (url === '/users/me') return Promise.resolve({ data: { nome: 'Usuário', created_at: new Date().toISOString() } });
            if (url.includes('/documents/')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: {} });
        }),
        patch: vi.fn().mockResolvedValue({}),
        post: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({})
    }
}));

// Mock do fetch global (IBGE)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve([])
}));

describe('CompanySettingsPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título de configurações e as abas', async () => {
        render(<CompanySettingsPage />);

        // Verifica o título principal
        expect(screen.getByText('Configurações')).toBeInTheDocument();
        expect(screen.getByText(/Gerencie os dados da/i)).toBeInTheDocument();

        // Verifica as abas de navegação
        expect(screen.getByText('Dados Cadastrais')).toBeInTheDocument();
        expect(screen.getByText('Documentação')).toBeInTheDocument();
        expect(screen.getByText('Equipe')).toBeInTheDocument();
        expect(screen.getByText('Meu Perfil')).toBeInTheDocument();

        // Aguarda carregamento dos dados da empresa no formulário
        await waitFor(() => {
            expect(screen.getByDisplayValue('Empresa Teste Ltda')).toBeInTheDocument();
        });
    });
});
