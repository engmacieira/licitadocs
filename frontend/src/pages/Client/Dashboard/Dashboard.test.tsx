import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './index';
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import { dashboardService } from '../../../services/dashboardService';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../services/companyService', () => ({ companyService: { getById: vi.fn() } }));
vi.mock('../../../services/dashboardService', () => ({ dashboardService: { getClientStats: vi.fn() } }));
vi.mock('../../../services/documentService', () => ({ documentService: { downloadDocument: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockCurrentCompany = { id: 'comp-123', razao_social: 'Empresa Teste LTDA' };

describe('Client Dashboard Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCurrentCompany });
    });

    // --- TESTES DO WIZARD (ONBOARDING INCOMPLETO) ---

    it('deve exibir o Wizard bloqueado na etapa de CONTRATO se não estiver assinado', async () => {
        const user = userEvent.setup();
        // Simula empresa presa na primeira etapa
        (companyService.getById as any).mockResolvedValueOnce({
            is_contract_signed: false,
            is_payment_active: false,
            is_admin_verified: false
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        // Aguarda carregar
        await waitFor(() => {
            expect(screen.getByText(/Finalize a configuração da/i)).toBeInTheDocument();
        });

        // Verifica o estado visual
        expect(screen.getByText('1. Assinatura Digital')).toBeInTheDocument();

        // Clica para assinar
        const signBtn = screen.getByRole('button', { name: /Assinar Agora/i });
        await user.click(signBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/contract-sign');
    });

    it('deve exibir o Wizard bloqueado na etapa de PAGAMENTO', async () => {
        const user = userEvent.setup();
        // Contrato OK, Pagamento Pendente
        (companyService.getById as any).mockResolvedValueOnce({
            is_contract_signed: true,
            is_payment_active: false,
            is_admin_verified: false
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        await waitFor(() => expect(screen.getByText('2. Ativação do Plano')).toBeInTheDocument());

        // O botão de pagamento agora deve estar habilitado e funcionar
        const payBtn = screen.getByRole('button', { name: /Realizar Pagamento/i });
        expect(payBtn).not.toBeDisabled();

        await user.click(payBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/payment');
    });

    it('deve exibir o Wizard aguardando VALIDAÇÃO DO ADMIN', async () => {
        // Tudo feito pelo cliente, falta o admin aprovar
        (companyService.getById as any).mockResolvedValueOnce({
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: false
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Em Análise')).toBeInTheDocument();
            expect(screen.getByText('3. Validação da Equipe')).toBeInTheDocument();
        });
    });

    // --- TESTES DO DASHBOARD REAL (REGULAR) ---

    it('deve carregar os dados reais do Dashboard se a empresa estiver Regular', async () => {
        // Empresa totalmente regular
        (companyService.getById as any).mockResolvedValueOnce({
            is_contract_signed: true,
            is_payment_active: true,
            is_admin_verified: true
        });

        // Simula os dados de estatísticas
        (dashboardService.getClientStats as any).mockResolvedValueOnce({
            company_name: 'Empresa Teste LTDA',
            total_docs: 10,
            docs_valid: 8,
            docs_expired: 2,
            recent_docs: [
                { id: 'doc-1', filename: 'CND_Federal.pdf', status: 'valid', created_at: '2026-02-15T10:00:00Z' }
            ]
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        // Agora não deve aparecer o Wizard, deve aparecer a Visão Geral
        await waitFor(() => {
            expect(screen.getByText('Visão Geral')).toBeInTheDocument();
            expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
        });

        // Verifica os KPIs
        expect(screen.getByText('10')).toBeInTheDocument(); // total
        expect(screen.getByText('8')).toBeInTheDocument();  // validos
        expect(screen.getByText('2')).toBeInTheDocument();  // vencidos
        expect(screen.getByText('80%')).toBeInTheDocument(); // saude (8/10)

        // Verifica a lista de documentos recentes
        expect(screen.getByText('CND_Federal.pdf')).toBeInTheDocument();
        expect(screen.getByText('Válido')).toBeInTheDocument();
    });

    it('deve permitir baixar um documento da lista', async () => {
        const user = userEvent.setup();

        (companyService.getById as any).mockResolvedValueOnce({
            is_contract_signed: true, is_payment_active: true, is_admin_verified: true
        });

        (dashboardService.getClientStats as any).mockResolvedValueOnce({
            company_name: 'Empresa', total_docs: 1, docs_valid: 1, docs_expired: 0,
            recent_docs: [{ id: 'doc-99', filename: 'balanco.pdf', status: 'valid', created_at: '2026-02-15T10:00:00Z' }]
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        await waitFor(() => expect(screen.getByText('balanco.pdf')).toBeInTheDocument());

        // Clica no botão de download (único botão na lista de recentes)
        const downloadBtns = screen.getAllByRole('button');
        // O botão de download é o último da tela (depois de "Atualizar" e "Ver tudo")
        const downloadBtn = downloadBtns[downloadBtns.length - 1];

        await user.click(downloadBtn);

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith('Iniciando download...');
            expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-99', 'balanco.pdf');
        });
    });
});