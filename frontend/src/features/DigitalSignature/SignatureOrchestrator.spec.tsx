import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignatureOrchestrator } from './SignatureOrchestrator';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import api from '../../services/api';
import userEvent from '@testing-library/user-event';

// --- MOCKS ---

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: vi.fn(), // ✅ AGORA SIM! É um mock do Vitest!
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        warning: vi.fn(),
    },
}));

vi.mock('react-to-print', () => ({
    useReactToPrint: vi.fn(),
}));

vi.mock('../../services/api', () => ({
    default: {
        post: vi.fn(),
        patch: vi.fn(),
        get: vi.fn(),
    },
}));

// Mock subcomponents to simplify orchestrator tests
vi.mock('./components/SignatureViewer', () => ({
    SignatureViewer: (props: any) => (
        <div data-testid="mock-viewer">
            viewer-{props.activeTab}
            <button onClick={props.handlePrint}>Print Button</button>
            <button onClick={() => props.setActiveTab('proxy')}>Set Proxy</button>
        </div>
    )
}));

vi.mock('./components/SignatureInstructions', () => ({
    SignatureInstructions: () => <div data-testid="mock-instructions" />
}));

vi.mock('./components/SignatureUpload', () => ({
    SignatureUpload: (props: any) => (
        <div data-testid="mock-upload">
            upload-{props.isLoading ? 'loading' : 'idle'}
            <button onClick={() => props.setContractFile(new File([''], 'c.pdf'))}>Add Contract</button>
            <button onClick={() => props.setProxyFile(new File([''], 'p.pdf'))}>Add Proxy</button>
            <button onClick={props.handleComplete}>Submit Button</button>
        </div>
    )
}));

describe('SignatureOrchestrator', () => {
    afterEach(cleanup);


    const mockPrintContract = vi.fn();
    const mockPrintProxy = vi.fn();
    const mockReloadContext = vi.fn().mockResolvedValue(undefined);

    const mockUser = {
        nome: 'João Silva',
        cpf: '123.456.789-00',
        genero: 'masculino'
    };

    const mockCompany = {
        id: 'company-123',
        razao_social: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-99'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useAuth as any).mockReturnValue({
            currentCompany: mockCompany,
            userProfile: mockUser,
            reloadContext: mockReloadContext
        });
        (useReactToPrint as any).mockImplementation((config: any) => {
            if (config.documentTitle?.includes('Contrato_SaaS')) return mockPrintContract;
            return mockPrintProxy;
        });

        // Mock API responses
        (api.post as any).mockResolvedValue({ data: {} });
        (api.patch as any).mockResolvedValue({ data: {} });
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/companies/')) return Promise.resolve({ data: mockCompany });
            if (url.includes('/users/me')) return Promise.resolve({ data: mockUser });
            return Promise.reject(new Error('Not Found'));
        });
    });

    it('should render all subcomponents correctly', async () => {
        render(<SignatureOrchestrator />);

        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/Assinatura Digital/i)).toBeInTheDocument();
        expect(screen.getByTestId('mock-viewer')).toBeInTheDocument();
        expect(screen.getByTestId('mock-instructions')).toBeInTheDocument();
        expect(screen.getByTestId('mock-upload')).toBeInTheDocument();
    });

    it('should handle tab switching and print calls correctly', async () => {
        const user = userEvent.setup();
        render(<SignatureOrchestrator />);

        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        expect(screen.getByText(/viewer-contract/i)).toBeInTheDocument();

        await user.click(screen.getByText(/Print Button/i));
        expect(mockPrintContract).toHaveBeenCalled();

        await user.click(screen.getByText(/Set Proxy/i));
        expect(screen.getByText(/viewer-proxy/i)).toBeInTheDocument();

        await user.click(screen.getByText(/Print Button/i));
        expect(mockPrintProxy).toHaveBeenCalled();
    });

    it('should handle submission validation error when files are missing', async () => {
        const user = userEvent.setup();
        render(<SignatureOrchestrator />);

        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        await user.click(screen.getByText(/Submit Button/i));
        expect(toast.error).toHaveBeenCalledWith("Anexe os dois documentos", expect.anything());
    });

    it('should handle successful submission flow', async () => {
        const user = userEvent.setup();
        render(<SignatureOrchestrator />);

        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        // Add "files" via mock buttons
        await user.click(screen.getByText(/Add Contract/i));
        await user.click(screen.getByText(/Add Proxy/i));

        // Submit
        await user.click(screen.getByText(/Submit Button/i));

        // Verify loading toast
        expect(toast.loading).toHaveBeenCalledWith(expect.stringContaining("Enviando documentos"));

        // Verify API calls
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(2);
            expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/companies/company-123/onboarding-step'));
        });

        // Verify success and navigation
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("sucesso"), expect.anything());
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle API errors during submission', async () => {
        const user = userEvent.setup();
        (api.post as any).mockRejectedValue(new Error('API Error'));

        render(<SignatureOrchestrator />);

        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        await user.click(screen.getByText(/Add Contract/i));
        await user.click(screen.getByText(/Add Proxy/i));
        await user.click(screen.getByText(/Submit Button/i));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Erro ao processar"), expect.anything());
        });
    });
});
