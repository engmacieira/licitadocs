import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { DashboardOrchestrator } from './DashboardOrchestrator';
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';

// Mock dos serviços
vi.mock('../../services/companyService', () => ({
    companyService: {
        getById: vi.fn()
    }
}));

vi.mock('../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        downloadDocument: vi.fn()
    }
}));

vi.mock('../../services/userService', () => ({
    userService: {
        getMe: vi.fn()
    }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
        success: vi.fn()
    }
}));

// Mock do useNavigate


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

describe('DashboardOrchestrator', () => {
    const mockCompany = {
        id: 'comp-1',
        razao_social: 'Minha Empresa Tech'
    };

    const mockFreshCompanyRegular = {
        id: 'comp-1',
        is_terms_accepted: true,
        is_data_completed: true,
        is_payment_active: true,
        is_contract_signed: true,
        is_admin_verified: true,
        admin_pendencies: null
    };

    const mockFreshCompanyPending = {
        id: 'comp-1',
        is_terms_accepted: true,
        is_data_completed: false,
        is_payment_active: false,
        is_contract_signed: false,
        is_admin_verified: false,
        admin_pendencies: 'Falta o comprovante de endereço.'
    };

    const mockDocuments = [
        { id: 'd1', title: 'Doc 1', status: 'valid', created_at: '2026-03-20T10:00:00Z', filename: 'doc1.pdf' },
        { id: 'd2', title: 'Doc 2', status: 'error', created_at: '2026-03-21T10:00:00Z', filename: 'doc2.pdf' },
        { id: 'd3', title: 'Doc 3', status: 'valid', created_at: '2026-03-22T10:00:00Z', filename: 'doc3.pdf' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCompany });
        (userService.getMe as any).mockResolvedValue({
            id: 'user-1',
            is_email_verified: true
        });
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <DashboardOrchestrator />
        </MemoryRouter>
    );

    it('deve exibir o estado de loading inicialmente', () => {
        (companyService.getById as any).mockReturnValue(new Promise(() => { })); // Never resolves
        renderComponent();

        // Verifica se os skeletons aparecem (temos div com animate-pulse)
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('deve renderizar o OnboardingWizard se a empresa não estiver regular', async () => {
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyPending);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Finalize a configuração da/i)).toBeInTheDocument();
            expect(screen.getByText('Minha Empresa Tech')).toBeInTheDocument();
            expect(screen.getByText('Falta o comprovante de endereço.')).toBeInTheDocument();
        });

        expect(documentService.getAll).not.toHaveBeenCalled();
    });

    it('deve renderizar o Dashboard Real se a empresa estiver regular', async () => {
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyRegular);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Resumo do Cofre')).toBeInTheDocument();
            expect(screen.getByText('Minha Empresa Tech')).toBeInTheDocument();
            expect(screen.getByText('Monitoramento Ativo')).toBeInTheDocument();
        });

        // KPIs
        expect(screen.getByText('Total no Cofre')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // total mockDocuments

        expect(screen.getByText('Regulares')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // status: 'valid' count

        expect(screen.getByText('Atenção Necessária')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // status: 'error' count

        expect(screen.getByText('Saúde Fiscal')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument(); // (2/3) * 100 = 66.666 -> 67

        // Painéis
        expect(screen.getByText('Ação Necessária')).toBeInTheDocument();
        expect(screen.getByText('Últimas Atualizações no Cofre')).toBeInTheDocument();
        expect(screen.getByText('Doc 1')).toBeInTheDocument();
        expect(screen.getByText('Doc 2')).toBeInTheDocument();
    });

    it('deve permitir baixar um documento do painel de atualizações recentes', async () => {
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyRegular);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        renderComponent();

        await waitFor(() => expect(screen.getByText('Resumo do Cofre')).toBeInTheDocument());

        const downloadButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-download'));
        fireEvent.click(downloadButtons[0]); // Download do primeiro doc válido recente

        expect(toast.info).toHaveBeenCalledWith("A iniciar download...");
        expect(documentService.downloadDocument).toHaveBeenCalled();
    });

    it('deve navegar corretamente ao clicar em Gerar Declarações', async () => {
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyRegular);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        renderComponent();

        await waitFor(() => expect(screen.getByText('Resumo do Cofre')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Gerar Declarações'));
        expect(mockNavigate).toHaveBeenCalledWith('/document-templates');
    });

    it('deve recarregar dados ao clicar no botão Atualizar', async () => {
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyRegular);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        renderComponent();

        await waitFor(() => expect(screen.getByText('Resumo do Cofre')).toBeInTheDocument());

        vi.clearAllMocks();
        (companyService.getById as any).mockResolvedValue(mockFreshCompanyRegular);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        fireEvent.click(screen.getByText('Atualizar'));

        await waitFor(() => {
            expect(companyService.getById).toHaveBeenCalledWith(mockCompany.id);
            expect(documentService.getAll).toHaveBeenCalledWith(mockCompany.id);
        });
    });

    it('deve lidar com erro ao carregar dados', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (companyService.getById as any).mockRejectedValue(new Error('API Error'));

        renderComponent();

        await waitFor(() => {
            expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalledWith("Erro ao carregar dados", expect.any(Error));
        consoleSpy.mockRestore();
    });
});
