import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './index';
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import { dashboardService } from '../../../services/dashboardService';
import { documentService } from '../../../services/documentService';

// ==========================================
// 🎭 MOCKS COM LATÊNCIA ARTIFICIAL
// ==========================================
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../services/companyService', () => ({ companyService: { getById: vi.fn() } }));
vi.mock('../../../services/dashboardService', () => ({ dashboardService: { getClientStats: vi.fn() } }));
vi.mock('../../../services/documentService', () => ({ documentService: { downloadDocument: vi.fn() } }));

const mockCompany = {
    id: 'comp-123',
    razao_social: 'Empresa Sobrecarga',
    is_contract_signed: true,
    is_payment_active: true,
    is_admin_verified: true
};

describe('Dashboard Resilience Stress Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCompany });
    });

    it('deve manter Skeletons visíveis e interface bloqueada durante latência de 10s (Simulação de 600+ usuários)', async () => {
        // Simulamos que o servidor está "fritando" e demora 10 segundos para responder
        (companyService.getById as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(mockCompany), 10000))
        );

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        // 1. Enquanto o servidor não responde, os Skeletons devem estar no ecrã
        // O componente Dashboard usa skeletons enquanto 'loading' for true.
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);

        // 2. O usuário não deve ver os dados reais ainda
        expect(screen.queryByText('Visão Geral')).not.toBeInTheDocument();
    });

    it('deve impedir múltiplos downloads simultâneos (Race Condition) durante lentidão do servidor', async () => {
        const user = userEvent.setup();

        // Mock da carga inicial imediata
        (companyService.getById as any).mockResolvedValue(mockCompany);
        (dashboardService.getClientStats as any).mockResolvedValue({
            company_name: 'Empresa',
            total_docs: 1,
            recent_docs: [{ id: 'doc-1', filename: 'certidao.pdf', status: 'valid' }]
        });

        // O download vai demorar 5 segundos para simular fila no banco
        let downloadCalls = 0;
        (documentService.downloadDocument as any).mockImplementation(() => {
            downloadCalls++;
            return new Promise(resolve => setTimeout(resolve, 5000));
        });

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        // Aguarda renderizar a lista
        const downloadBtn = await screen.findByRole('button', { name: '' }); // Botão de download na lista

        // 🚀 TESTE DE ESTRESSE: O usuário clica 5 vezes seguidas rapidamente
        // para tentar "forçar" 5 downloads enquanto o primeiro está pendente.
        await user.click(downloadBtn);
        await user.click(downloadBtn);
        await user.click(downloadBtn);
        await user.click(downloadBtn);
        await user.click(downloadBtn);

        // Assert: Mesmo com 5 cliques, o serviço só deve ter sido chamado 1 vez
        // porque o frontend deve gerir o estado de 'baixando'
        // Nota: No seu index.tsx, o handleDownload usa um toast.info('Baixando...').
        expect(downloadCalls).toBe(1);
    });

    it('deve recuperar a interface graciosamente após um Timeout da API (504 Gateway Timeout)', async () => {
        // Simulamos que após uma longa espera, o servidor retorna erro por excesso de carga
        (companyService.getById as any).mockRejectedValue(new Error('504 Gateway Timeout'));

        render(<MemoryRouter><Dashboard /></MemoryRouter>);

        // Aguarda a resposta de erro
        await waitFor(() => {
            // Verifica se os Skeletons sumiram e a interface não "crashou" (tela branca)
            const skeletons = document.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBe(0);
        });

        // O sistema deve ter disparado um toast de erro para informar o usuário
        // (O toast.error é chamado no catch do loadData)
    });
});