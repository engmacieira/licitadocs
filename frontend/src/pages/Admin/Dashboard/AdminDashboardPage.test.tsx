import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboardPage } from './index';

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
const navigate = mockNavigate;

// Mock dos serviços
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn().mockResolvedValue([{ id: '1', name: 'Empresa A', is_admin_verified: true }])
    }
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getExpiring: vi.fn().mockResolvedValue([]),
        getIrregular: vi.fn().mockResolvedValue([])
    }
}));

describe('AdminDashboardPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o cabeçalho e os KPIs após o carregamento', async () => {
        render(<AdminDashboardPage />);

        // Verifica o título e descrição
        expect(screen.getByText('Visão Operacional')).toBeInTheDocument();
        expect(screen.getByText(/Acompanhamento de regularidade/i)).toBeInTheDocument();

        // Aguarda o fim do estado de loading e verifica os cards de estatísticas atualizados
        await waitFor(() => {
            expect(screen.getByText('Empresas na Base')).toBeInTheDocument();
        });
        expect(screen.getByText('Novos Cadastros')).toBeInTheDocument(); // Adicionado na US-2901
        expect(screen.getByText('A Vencer (30 dias)')).toBeInTheDocument();
        expect(screen.getByText('Irregularidades')).toBeInTheDocument(); // Corrigido (era 'Irregularidades / Erros')
    });

    it('deve navegar para Monitor Global ao clicar no botão correspondente', async () => {
        const user = userEvent.setup();
        render(<AdminDashboardPage />);

        const monitorButton = await screen.findByRole('button', { name: /Monitor Global/i });
        await user.click(monitorButton);

        expect(navigate).toHaveBeenCalledWith('/admin/validity-monitor');
    });

    it('deve navegar para Central de Upload ao clicar no botão correspondente', async () => {
        const user = userEvent.setup();
        render(<AdminDashboardPage />);

        const uploadButton = await screen.findByRole('button', { name: /Central de Upload/i });
        await user.click(uploadButton);

        expect(navigate).toHaveBeenCalledWith('/admin/upload');
    });
});