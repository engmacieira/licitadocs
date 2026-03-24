import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TemplatesOrchestrator } from './TemplatesOrchestrator';
import { useAuth } from '../../contexts/AuthContext';

// Mock do useAuth
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock do lucide-react (opcional, mas evita erros de renderização em alguns ambientes)
vi.mock('lucide-react', () => ({
    LayoutGrid: () => <div data-testid="icon-grid" />,
    Building2: () => <div data-testid="icon-building" />,
    UserCircle2: () => <div data-testid="icon-user" />,
    FileText: () => <div data-testid="icon-file" />,
    FileBadge: () => <div data-testid="icon-badge" />,
    Download: () => <div data-testid="icon-download" />,
}));

// Mock das seções para focar no Orquestrador
vi.mock('./components/DeclarationSection', () => ({
    DeclarationSection: ({ companyData }: any) => (
        <div data-testid="declaration-section">
            Declaration for {companyData.razaoSocial}
        </div>
    ),
}));

vi.mock('./components/AttestationSection', () => ({
    AttestationSection: ({ companyData }: any) => (
        <div data-testid="attestation-section">
            Attestation for {companyData.razaoSocial}
        </div>
    ),
}));

describe('TemplatesOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve mostrar estado de carregamento quando não houver empresa', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: null,
            userProfile: null,
        });

        render(<TemplatesOrchestrator />);
        
        expect(screen.getByText(/A carregar dados da empresa.../i)).toBeInTheDocument();
        expect(screen.getByTestId('icon-building')).toBeInTheDocument();
    });

    it('deve renderizar o cabeçalho e as seções quando os dados estiverem disponíveis', () => {
        const mockCompany = {
            razao_social: 'Minha Empresa S.A.',
            cnpj: '00.111.222/0001-33',
            logradouro: 'Rua das Flores',
            numero: '100',
            bairro: 'Jardim',
            cidade: 'Metropolis',
            estado: 'SP',
            responsavel_nome: 'João Silva',
            responsavel_cpf: '123.456.789-00'
        };

        (useAuth as any).mockReturnValue({
            currentCompany: mockCompany,
            userProfile: { nome: 'João Silva', cpf: '123.456.789-00' },
        });

        render(<TemplatesOrchestrator />);

        // Header
        expect(screen.getByText('Modelos de Documentos')).toBeInTheDocument();
        
        // Dados da Empresa no Painel
        expect(screen.getByText('Minha Empresa S.A.')).toBeInTheDocument();
        expect(screen.getByText(/00.111.222\/0001-33/i)).toBeInTheDocument();
        expect(screen.getByText(/Rua das Flores, 100 - Jardim/i)).toBeInTheDocument();
        expect(screen.getByText(/Metropolis\/SP/i)).toBeInTheDocument();

        // Dados do Representante
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText(/123.456.789-00/i)).toBeInTheDocument();

        // Seções de Documentos
        expect(screen.getByTestId('declaration-section')).toBeInTheDocument();
        expect(screen.getByTestId('attestation-section')).toBeInTheDocument();
        expect(screen.getByText(/Declaration for Minha Empresa S.A./i)).toBeInTheDocument();
    });

    it('deve usar fallbacks quando os campos da empresa estiverem incompletos', () => {
        const mockPartialCompany = {
            razao_social: 'Empresa Simples',
            cnpj: '11.111.111/1111-11'
        };

        (useAuth as any).mockReturnValue({
            currentCompany: mockPartialCompany,
            userProfile: null,
        });

        render(<TemplatesOrchestrator />);

        expect(screen.getByText('Empresa Simples')).toBeInTheDocument();
        expect(screen.getByText(/11.111.111\/1111-11/i)).toBeInTheDocument();
        // Fallbacks
        expect(screen.getByText(/Cidade\/UF/i)).toBeInTheDocument();
        expect(screen.getByText(/NOME DO REPRESENTANTE/i)).toBeInTheDocument();
    });
});
