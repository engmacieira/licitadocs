import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanySettings } from './index';
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS COM LATÊNCIA
// ==========================================
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../services/companyService', () => ({ companyService: { getById: vi.fn(), getTeam: vi.fn(), inviteMember: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockCompany = { id: 'comp-123', razao_social: 'Empresa Teste' };

describe('CompanySettings Resilience Stress Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCompany, user: { sub: 'admin@teste.com' } });
    });

    it('deve estabilizar na aba correta mesmo após trocas frenéticas (Race Condition de Abas)', async () => {
        const user = userEvent.setup();

        (companyService.getById as any).mockResolvedValue(mockCompany);

        // Simulamos que a aba de Equipe é muito pesada e demora 3 segundos para carregar
        (companyService.getTeam as any).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve([]), 3000))
        );

        render(<CompanySettings />);
        await screen.findByText('Dados Cadastrais'); // Aguarda carregamento inicial

        // 🚀 TESTE DE ESTRESSE: O usuário clica como um louco alternando as abas
        const tabEquipe = screen.getByRole('button', { name: /Equipe/i });
        const tabSeguranca = screen.getByRole('button', { name: /Segurança/i });
        const tabDocumentos = screen.getByRole('button', { name: /Documentação/i });

        await user.click(tabEquipe);     // Dispara o getTeam (lento)
        await user.click(tabDocumentos); // Muda de ideia
        await user.click(tabEquipe);     // Volta para equipe
        await user.click(tabSeguranca);  // Clica finalmente em Segurança (Rápido)

        // ASSERT: A interface DEVE estabilizar na última aba clicada (Segurança),
        // e não pode ser sobrescrita quando o `getTeam` finalmente terminar de carregar 3 segundos depois.
        expect(screen.getByText(/Atualize a senha de acesso/i)).toBeInTheDocument();
        expect(screen.queryByText(/Membros Ativos/i)).not.toBeInTheDocument();
    });

    it('deve impedir o envio de múltiplos convites simultâneos para a mesma pessoa', async () => {
        const user = userEvent.setup();

        (companyService.getById as any).mockResolvedValue(mockCompany);
        (companyService.getTeam as any).mockResolvedValue([]);

        // Simulamos o backend demorando 2 segundos para processar o convite
        let inviteCalls = 0;
        (companyService.inviteMember as any).mockImplementation(() => {
            inviteCalls++;
            return new Promise(resolve => setTimeout(() => resolve({ message: 'OK' }), 2000));
        });

        render(<CompanySettings />);
        await screen.findByText('Dados Cadastrais');

        // Vai para a aba de equipe
        await user.click(screen.getByRole('button', { name: /Equipe/i }));

        const emailInput = await screen.findByPlaceholderText('email@...');
        await user.type(emailInput, 'novo@teste.com');

        const inviteBtn = screen.getByRole('button', { name: /Enviar Convite/i });

        // 🚀 TESTE DE ESTRESSE: O usuário clica 4 vezes rapidamente no botão de convite
        await user.click(inviteBtn);
        await user.click(inviteBtn);
        await user.click(inviteBtn);
        await user.click(inviteBtn);

        // ASSERT: A API só deve ser chamada 1 vez. O botão deve estar bloqueado durante o `inviting`.
        expect(inviteCalls).toBe(1);
    });
});