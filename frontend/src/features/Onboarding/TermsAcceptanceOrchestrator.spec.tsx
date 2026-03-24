import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TermsAcceptanceOrchestrator } from './TermsAcceptanceOrchestrator';
import userEvent from '@testing-library/user-event';
import api from '../../services/api';
import { toast } from 'sonner';

// Mocks
vi.mock('../../services/api', () => ({
    default: {
        patch: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        }
    },
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: {
            id: '123',
            razao_social: 'Empresa Teste',
            cnpj: '00.000.000/0000-00',
        },
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { legalName: 'Empresa Teste' } }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

// Mocking content components
vi.mock('../../components/signature/ContractContent', () => ({
    ContractContent: () => <div data-testid="contract-content">Contract Content</div>
}));
vi.mock('../../components/signature/ProxyContent', () => ({
    ProxyContent: () => <div data-testid="proxy-content">Proxy Content</div>
}));
vi.mock('../../components/signature/TermsOfAcceptanceContent', () => ({
    TermsOfAcceptanceContent: () => <div data-testid="terms-content">Terms Content</div>
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    ScrollText: () => <div data-testid="icon-scroll" />,
    FileText: () => <div data-testid="icon-file" />,
    ArrowRight: () => <div data-testid="icon-arrow-right" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    Lock: () => <div data-testid="icon-lock" />,
    Unlock: () => <div data-testid="icon-unlock" />,
    X: () => <div data-testid="icon-x" />,
    ExternalLink: () => <div data-testid="icon-external" />,
    Loader2: () => <div data-testid="icon-loader" />,
}));

describe('TermsAcceptanceOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with company data', () => {
        render(<TermsAcceptanceOrchestrator />);
        
        expect(screen.getByText(/Termos de Uso e Minutas/i)).toBeInTheDocument();
        expect(screen.getByText(/Empresa Teste/i)).toBeInTheDocument();
    });

    it('handles scroll in main terms to mark as read', async () => {
        render(<TermsAcceptanceOrchestrator />);
        
        const mainContent = document.getElementById('main-doc-content')!;
        
        // Define properties on the element because RTL might not proxy them correctly to currentTarget
        Object.defineProperty(mainContent, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(mainContent, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(mainContent, 'clientHeight', { value: 200, configurable: true });

        fireEvent.scroll(mainContent);

        expect(screen.getByText(/Termo Lido/i)).toBeInTheDocument();
    });

    it('opens and handles scroll in modals', async () => {
        const user = userEvent.setup();
        render(<TermsAcceptanceOrchestrator />);
        
        await user.click(screen.getByText(/2. Contrato Principal/i));
        expect(screen.getByText(/Leitura da Minuta: Contrato Principal/i)).toBeInTheDocument();

        const content = screen.getByTestId('contract-content');
        const modalScrollContainer = content.closest('.overflow-y-auto')!;
        
        Object.defineProperty(modalScrollContainer, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(modalScrollContainer, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(modalScrollContainer, 'clientHeight', { value: 200, configurable: true });

        fireEvent.scroll(modalScrollContainer);

        expect(screen.getByText(/Leitura registrada!/i)).toBeInTheDocument();
        
        await user.click(screen.getByText(/Fechar e Voltar/i));
        expect(screen.queryByText(/Leitura da Minuta: Contrato Principal/i)).not.toBeInTheDocument();
    });

    it('enables the acceptance checkbox only after all documents are read', async () => {
        const user = userEvent.setup();
        render(<TermsAcceptanceOrchestrator />);
        
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox).toBeDisabled();

        // 1. Read Main Terms
        const mainContent = document.getElementById('main-doc-content')!;
        Object.defineProperty(mainContent, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(mainContent, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(mainContent, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(mainContent);

        // 2. Read Contract
        await user.click(screen.getByText(/2. Contrato Principal/i));
        const cScroll = screen.getByTestId('contract-content').closest('.overflow-y-auto')!;
        Object.defineProperty(cScroll, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(cScroll, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(cScroll, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(cScroll);
        await user.click(screen.getByText(/Fechar e Voltar/i));

        // 3. Read Proxy
        await user.click(screen.getByText(/3. Procuração Específica/i));
        const pScroll = screen.getByTestId('proxy-content').closest('.overflow-y-auto')!;
        Object.defineProperty(pScroll, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(pScroll, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(pScroll, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(pScroll);
        await user.click(screen.getByText(/Fechar e Voltar/i));

        expect(checkbox).not.toBeDisabled();
        await user.click(checkbox);
        expect(checkbox.checked).toBe(true);
    });

    it('submits terms acceptance successfully', async () => {
        const user = userEvent.setup();
        render(<TermsAcceptanceOrchestrator />);
        
        // Mark all as read
        const mainContent = document.getElementById('main-doc-content')!;
        Object.defineProperty(mainContent, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(mainContent, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(mainContent, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(mainContent);
        
        await user.click(screen.getByText(/2. Contrato Principal/i));
        const cScroll = screen.getByTestId('contract-content').closest('.overflow-y-auto')!;
        Object.defineProperty(cScroll, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(cScroll, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(cScroll, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(cScroll);
        await user.click(screen.getByText(/Fechar e Voltar/i));

        await user.click(screen.getByText(/3. Procuração Específica/i));
        const pScroll = screen.getByTestId('proxy-content').closest('.overflow-y-auto')!;
        Object.defineProperty(pScroll, 'scrollTop', { value: 1000, configurable: true });
        Object.defineProperty(pScroll, 'scrollHeight', { value: 1200, configurable: true });
        Object.defineProperty(pScroll, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(pScroll);
        await user.click(screen.getByText(/Fechar e Voltar/i));

        await user.click(screen.getByRole('checkbox'));
        
        vi.mocked(api.patch).mockResolvedValueOnce({ data: { success: true } });

        await user.click(screen.getByRole('button', { name: /Aceitar e Continuar/i }));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/companies/123/onboarding-step?step=terms');
            expect(toast.success).toHaveBeenCalledWith("Termos aceitos com sucesso!", expect.anything());
            expect(mockNavigate).toHaveBeenCalledWith('/payment');
        });
    });
});
