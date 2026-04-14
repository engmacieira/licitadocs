import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentTemplatesPage } from './index';
import { useAuth } from '../../../contexts/AuthContext';

// 1. Mock do react-router-dom
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

// 2. Mock do AuthContext - CORRIGIDO: nome_completo para bater com o Orchestrator
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

// 3. Mock do lucide-react para evitar erros de ícone
vi.mock('lucide-react', () => ({
    Building2: () => <div data-testid="icon-building" />,
    UserCircle2: () => <div data-testid="icon-user" />,
    FileText: () => <div data-testid="icon-file" />,
    FileBadge: () => <div data-testid="icon-badge" />,
    Download: () => <div data-testid="icon-download" />,
    LayoutGrid: () => <div data-testid="icon-grid" />,
    AlertTriangle: () => <div data-testid="icon-alert" />,
    ShieldCheck: () => <div data-testid="icon-shield" />,
    Lightbulb: () => <div data-testid="icon-light" />,
    Building: () => <div data-testid="icon-building-simple" />,
    Hash: () => <div data-testid="icon-hash" />
}));

describe('DocumentTemplatesPage Integration Test', () => {
    const mockCompany = {
        id: '1',
        razao_social: 'Empresa Teste Ltda',
        cnpj: '12.345.678/0001-90',
        logradouro: 'Rua Teste',
        numero: '123',
        cidade: 'São Paulo',
        estado: 'SP'
    };

    const mockUser = {
        nome_completo: 'Usuário Teste',
        cpf: '123.456.789-00'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            currentCompany: mockCompany,
            userProfile: mockUser,
        });
    });

    it('deve renderizar o orquestrador com os dados da empresa e seções', () => {
        render(<DocumentTemplatesPage />);

        // Verifica se os dados da empresa (que agora estão no Orquestrador) aparecem
        const companyName = screen.getAllByText('Empresa Teste Ltda');
        expect(companyName.length).toBeGreaterThan(0);

        expect(screen.getByText(/12.345.678\/0001-90/i)).toBeInTheDocument();
        expect(screen.getByText('Usuário Teste')).toBeInTheDocument();

        // Verifica se as duas grandes seções foram montadas
        expect(screen.getByText(/Declarações Unificadas/i)).toBeInTheDocument();
        expect(screen.getByText(/Atestado de Capacidade/i)).toBeInTheDocument();
    });
});