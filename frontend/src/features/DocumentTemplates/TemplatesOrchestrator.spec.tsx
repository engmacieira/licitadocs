// src/features/DocumentTemplates/TemplatesOrchestrator.spec.tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TemplatesOrchestrator } from './TemplatesOrchestrator';
import { useAuth } from '../../contexts/AuthContext';

// Mock do useAuth - Mantendo o padrão para controle total nos testes
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock do lucide-react para evitar ruído no JSDOM
vi.mock('lucide-react', () => ({
    LayoutGrid: () => <div data-testid="icon-grid" />,
    Building2: () => <div data-testid="icon-building" />,
    UserCircle2: () => <div data-testid="icon-user" />,
    FileText: () => <div data-testid="icon-file" />,
    FileBadge: () => <div data-testid="icon-badge" />,
    Download: () => <div data-testid="icon-download" />,
}));

// Mock das seções - Note que removi o data-testid daqui para não colidir com o wrapper do Orchestrator
vi.mock('./components/DeclarationSection', () => ({
    DeclarationSection: ({ companyData }: any) => (
        <div data-testid="mock-declaration-content">
            Mocked Declaration for {companyData.razaoSocial}
        </div>
    ),
}));

vi.mock('./components/AttestationSection', () => ({
    AttestationSection: ({ companyData }: any) => (
        <div data-testid="mock-attestation-content">
            Mocked Attestation for {companyData.razaoSocial}
        </div>
    ),
}));

describe('TemplatesOrchestrator', () => {
    const mockFullCompany = {
        id: '123',
        razao_social: 'Minha Empresa S.A.',
        cnpj: '00.111.222/0001-33',
        logradouro: 'Rua das Flores',
        numero: '100',
        bairro: 'Jardim',
        cidade: 'Metropolis',
        estado: 'SP'
    };

    const mockUserProfile = {
        nome_completo: 'João Silva',
        cpf: '123.456.789-00'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve mostrar estado de carregamento quando não houver empresa', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: null,
            userProfile: null,
        });

        render(<TemplatesOrchestrator />);

        expect(screen.getByText(/A carregar dados da empresa/i)).toBeInTheDocument();
    });

    it('deve renderizar o cabeçalho e as seções quando os dados estiverem disponíveis', () => {
        (useAuth as any).mockReturnValue({
            currentCompany: mockFullCompany,
            userProfile: mockUserProfile,
        });

        render(<TemplatesOrchestrator />);

        // Usamos getAllByText e pegamos o primeiro (do cabeçalho) para evitar o erro de múltiplos elementos
        const nameElements = screen.getAllByText('Minha Empresa S.A.');
        expect(nameElements.length).toBeGreaterThan(0);
        expect(nameElements[0]).toBeInTheDocument();

        // Validando dados via regex para ser mais flexível com espaços/formatação
        expect(screen.getByText(/00.111.222\/0001-33/i)).toBeInTheDocument();
        expect(screen.getByText(/Rua das Flores, 100 - Jardim/i)).toBeInTheDocument();

        // Verifica se o orquestrador montou as áreas de seção corretamente
        expect(screen.getByTestId('declaration-section')).toBeInTheDocument();
        expect(screen.getByTestId('attestation-section')).toBeInTheDocument();

        // Verifica se o conteúdo mockado injetou os dados
        expect(screen.getByText(/Mocked Declaration for Minha Empresa S.A./i)).toBeInTheDocument();
    });

    it('deve usar fallbacks quando os campos da empresa estiverem incompletos', () => {
        const mockPartialCompany = {
            razao_social: 'Empresa Simples',
            cnpj: '11.111.111/1111-11'
            // Faltam endereço e representante
        };

        (useAuth as any).mockReturnValue({
            currentCompany: mockPartialCompany,
            userProfile: null,
        });

        render(<TemplatesOrchestrator />);

        expect(screen.getByText('Empresa Simples')).toBeInTheDocument();
        expect(screen.getByText('Endereço não informado')).toBeInTheDocument();
        expect(screen.getByText('Não informado')).toBeInTheDocument(); // Fallback do representante
    });
});