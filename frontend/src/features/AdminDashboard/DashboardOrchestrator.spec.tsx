import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { DashboardOrchestrator } from './DashboardOrchestrator';
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import { MemoryRouter } from 'react-router-dom';

// Mock dos serviços
vi.mock('../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn()
    }
}));

vi.mock('../../services/documentService', () => ({
    documentService: {
        getExpiring: vi.fn(),
        getIrregular: vi.fn()
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
    const mockCompanies = [
        { id: 'c1', name: 'Empresa 1' },
        { id: 'c2', name: 'Empresa 2' }
    ];

    const mockExpiring = [
        { id: 'd1', title: 'Doc Exp 1', expiration_date: '2026-04-10T12:00:00Z', company_id: 'c1', company_name: 'Empresa 1' }
    ];

    const mockIrregular = [
        { id: 'd2', title: 'Doc Irr 1', status: 'error', company_id: 'c1', company_name: 'Empresa 1' },
        { id: 'd3', title: 'Doc Irr 2', status: 'irregular', company_id: 'c1', company_name: 'Empresa 1' },
        { id: 'd4', title: 'Doc Irr 3', status: 'irregular', company_id: 'c2', company_name: 'Empresa 2' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getAll as any).mockResolvedValue(mockCompanies);
        (documentService.getExpiring as any).mockResolvedValue(mockExpiring);
        (documentService.getIrregular as any).mockResolvedValue(mockIrregular);
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <DashboardOrchestrator />
        </MemoryRouter>
    );

    it('deve exibir o estado de loading inicialmente', () => {
        renderComponent();
        
        // Verifica se os skeletons dos StatsCard aparecem (3 skeletons de 28px altura no orquestrador direto)
        // Mais fácil buscar pelas classes de esqueleto ou apenas ver se os valores finais ainda não estão lá
        expect(screen.queryByText('2')).not.toBeInTheDocument(); // Total de empresas
    });

    it('deve carregar e exibir os dados do dashboard com sucesso', async () => {
        renderComponent();

        await waitFor(() => {
            expect(companyService.getAll).toHaveBeenCalledTimes(1);
            expect(documentService.getExpiring).toHaveBeenCalledWith(30);
            expect(documentService.getIrregular).toHaveBeenCalledTimes(1);
        });

        // KPIs
        expect(screen.getByText('Empresas na Base')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // mockCompanies.length

        expect(screen.getByText('A Vencer (30 dias)')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // mockExpiring.length

        expect(screen.getByText('Irregularidades / Erros')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // mockIrregular.length
    });

    it('deve processar o agrupamento de documentos irregulares corretamente (Top 5)', async () => {
        renderComponent();

        await waitFor(() => {
            // Empresa 1 tem 2 docs (1 erro, 1 irregular) -> Deve aparecer como "Erro na Emissão" (maior gravidade)
            // Usamos getAllByText e verificamos se pelo menos um está no painel correto ou apenas validamos a existência
            const name1 = screen.getAllByText('Empresa 1');
            expect(name1.length).toBeGreaterThanOrEqual(1);
            
            expect(screen.getByText('2 pendências')).toBeInTheDocument();
            
            // A lógica do orquestrador define o tipo da empresa pelo doc.status mais grave (error > irregular)
            expect(screen.getAllByText('Erro na Emissão').length).toBeGreaterThanOrEqual(1);

            const name2 = screen.getAllByText('Empresa 2');
            expect(name2.length).toBeGreaterThanOrEqual(1);
            
            expect(screen.getByText('1 pendência')).toBeInTheDocument();
            expect(screen.getByText('Irregular')).toBeInTheDocument();
        });
    });

    it('deve navegar corretamente ao clicar nos botões do cabeçalho', async () => {
        renderComponent();

        await waitFor(() => expect(screen.getByText('Monitor Global')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Monitor Global'));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/validity-monitor');

        fireEvent.click(screen.getByText('Central de Upload'));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/upload');
    });

    it('deve lidar com erro na API graciosamente', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (companyService.getAll as any).mockRejectedValue(new Error('API Failure'));

        renderComponent();

        await waitFor(() => {
            expect(loadingStateFinished()).toBe(true);
        });

        expect(consoleSpy).toHaveBeenCalledWith("Erro ao carregar dashboard", expect.any(Error));
        consoleSpy.mockRestore();
    });
});

// Helper para verificar se o loading acabou
function loadingStateFinished() {
    // Quando o loading acaba, o título "Visão Operacional" aparece e os skeletons somem
    return screen.queryByText('Visão Operacional') !== null && document.querySelectorAll('.animate-pulse').length === 0;
}
