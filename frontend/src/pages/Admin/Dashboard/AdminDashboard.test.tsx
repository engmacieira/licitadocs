import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from './index';
import { adminService } from '../../../services/adminService';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../services/adminService', () => ({
    adminService: {
        getStats: vi.fn(),
        getPendingQueue: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Dados falsos para simular a resposta da API
const mockStats = {
    total_companies: 150,
    active_companies: 120,
    pending_approval: 5,
    documents_generated_month: 450,
};

const mockQueue = [
    {
        company_id: 'emp-123',
        company_name: 'Construtora Alpha LTDA',
        date: '2026-02-15T10:00:00.000Z',
    },
];

describe('AdminDashboard Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar a estrutura inicial do Dashboard e os KPIs', async () => {
        // Simula o retorno de sucesso da API
        (adminService.getStats as any).mockResolvedValueOnce(mockStats);
        (adminService.getPendingQueue as any).mockResolvedValueOnce([]);

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText('Torre de Controle')).toBeInTheDocument();

        // Aguarda a resolução do useEffect e verifica se os KPIs foram renderizados
        await waitFor(() => {
            expect(screen.getByText('150')).toBeInTheDocument(); // total_companies
            expect(screen.getByText('120')).toBeInTheDocument(); // active_companies
            expect(screen.getByText('5')).toBeInTheDocument();   // pending_approval
            expect(screen.getByText('450')).toBeInTheDocument(); // documents_generated_month
        });
    });

    it('deve exibir a fila de pendências corretamente', async () => {
        (adminService.getStats as any).mockResolvedValueOnce(mockStats);
        (adminService.getPendingQueue as any).mockResolvedValueOnce(mockQueue);

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        // Aguarda a fila carregar e verifica o nome da empresa
        await waitFor(() => {
            expect(screen.getByText('Construtora Alpha LTDA')).toBeInTheDocument();
            expect(screen.getByText(/Registrado em/i)).toBeInTheDocument();
            expect(screen.getByText('1 aguardando')).toBeInTheDocument(); // Badge no título
        });
    });

    it('deve exibir mensagem de sucesso quando a fila de pendências estiver vazia', async () => {
        (adminService.getStats as any).mockResolvedValueOnce(mockStats);
        // Simula fila vazia
        (adminService.getPendingQueue as any).mockResolvedValueOnce([]);

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Tudo limpo! Nenhuma pendência na fila.')).toBeInTheDocument();
        });
    });

    it('deve navegar para as rotas corretas ao clicar nos botões de ação', async () => {
        const user = userEvent.setup();
        (adminService.getStats as any).mockResolvedValueOnce(mockStats);
        (adminService.getPendingQueue as any).mockResolvedValueOnce(mockQueue);

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        // Aguarda carregar a fila para que o botão "Analisar" exista
        await waitFor(() => {
            expect(screen.getByText('Construtora Alpha LTDA')).toBeInTheDocument();
        });

        // 1. Testa botão de Buscar Empresa
        await user.click(screen.getByRole('button', { name: /Buscar Empresa/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies');

        // 2. Testa botão de Upload Avulso
        await user.click(screen.getByRole('button', { name: /Upload Avulso/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/upload');

        // 3. Testa botão de Analisar Pendência
        const analisarBtns = screen.getAllByRole('button', { name: /Analisar/i });
        await user.click(analisarBtns[0]);
        // Como o ID da empresa mockada é 'emp-123', a rota deve ser esta:
        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies/emp-123/validate');
    });

    it('deve exibir o painel do Robô de Captura no lado direito', async () => {
        (adminService.getStats as any).mockResolvedValueOnce(mockStats);
        (adminService.getPendingQueue as any).mockResolvedValueOnce([]);

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Robô de Captura')).toBeInTheDocument();
            expect(screen.getByText('Sistema Operante')).toBeInTheDocument();
        });
    });
});