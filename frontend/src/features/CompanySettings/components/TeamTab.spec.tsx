import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamTab } from './TeamTab';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

// Mock companyService
vi.mock('../../../services/companyService', () => ({
    companyService: {
        inviteMember: vi.fn(),
        updateMemberRole: vi.fn(),
        removeMember: vi.fn()
    }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(() => 'toast-id'),
    }
}));

const mockUser = { id: 'user-1', email: 'owner@example.com' };
const mockTeam = [
    { user_id: 'user-1', name: 'Owner', email: 'owner@example.com', role: 'MASTER', status: true, joined_at: '2023-01-01T10:00:00Z' },
    { user_id: 'user-2', name: 'Viewer', email: 'viewer@example.com', role: 'VIEWER', status: true, joined_at: '2023-02-01T10:00:00Z' }
];

describe('TeamTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);
    });

    it('deve renderizar o formulário de convite e a lista de membros', () => {
        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={vi.fn()} user={mockUser} />);

        expect(screen.getByText('Convidar Membro')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('email@empresa.com.br')).toBeInTheDocument();
        expect(screen.getByText('Membros Ativos (2)')).toBeInTheDocument();
        expect(screen.getByText('owner@example.com')).toBeInTheDocument();
        expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
    });

    it('deve chamar companyService.inviteMember ao enviar convite', async () => {
        const loadTeamData = vi.fn();
        vi.mocked(companyService.inviteMember).mockResolvedValue({ message: 'Convite enviado' } as any);
        
        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={loadTeamData} user={mockUser} />);

        const emailInput = screen.getByPlaceholderText('email@empresa.com.br');
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
        
        const inviteButton = screen.getByText('Enviar Convite');
        fireEvent.click(inviteButton);

        await waitFor(() => {
            expect(companyService.inviteMember).toHaveBeenCalledWith('comp-1', { email: 'new@example.com', role: 'VIEWER' });
            expect(toast.success).toHaveBeenCalledWith('Convite enviado!', expect.any(Object));
            expect(loadTeamData).toHaveBeenCalled();
        });
    });

    it('deve abrir o modal de edição e atualizar a role do membro', async () => {
        const loadTeamData = vi.fn();
        vi.mocked(companyService.updateMemberRole).mockResolvedValue({} as any);

        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={loadTeamData} user={mockUser} />);

        // Encontrar o botão de edição (Edit icon) dentro do container do Viewer user
        const viewerRow = screen.getByText('Viewer').closest('div[class*="flex-col"]');
        const editButton = viewerRow?.querySelectorAll('button')[0];
        
        if (editButton) fireEvent.click(editButton);

        expect(screen.getByText('Editar Permissões')).toBeInTheDocument();
        // O e-mail aparece no modal, então usamos getAllByText ou buscamos no modal
        expect(screen.getAllByText('viewer@example.com').length).toBeGreaterThan(0);

        const roleSelect = screen.getByRole('combobox');
        fireEvent.change(roleSelect, { target: { value: 'MASTER' } });

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(companyService.updateMemberRole).toHaveBeenCalledWith('comp-1', 'user-2', 'MASTER');
            expect(toast.success).toHaveBeenCalledWith('Permissão atualizada!');
            expect(loadTeamData).toHaveBeenCalled();
            expect(screen.queryByText('Editar Permissões')).not.toBeInTheDocument();
        });
    });

    it('não deve permitir editar a própria permissão', () => {
        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={vi.fn()} user={mockUser} />);

        // O dono é user-1 (mockUser)
        const ownerRow = screen.getByText('Owner').closest('div[class*="flex-col"]');
        const editButton = ownerRow?.querySelectorAll('button')[0];
        
        if (editButton) fireEvent.click(editButton);

        expect(toast.error).toHaveBeenCalledWith('Ação não permitida', expect.any(Object));
        expect(screen.queryByText('Editar Permissões')).not.toBeInTheDocument();
    });

    it('deve chamar companyService.removeMember ao clicar em remover e confirmar', async () => {
        const loadTeamData = vi.fn();
        vi.mocked(companyService.removeMember).mockResolvedValue({} as any);

        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={loadTeamData} user={mockUser} />);

        const viewerRow = screen.getByText('Viewer').closest('div[class*="flex-col"]');
        const removeButton = viewerRow?.querySelectorAll('button')[1];

        if (removeButton) fireEvent.click(removeButton);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(companyService.removeMember).toHaveBeenCalledWith('comp-1', 'user-2');
            expect(toast.success).toHaveBeenCalledWith('Membro removido!', expect.any(Object));
            expect(loadTeamData).toHaveBeenCalled();
        });
    });

    it('não deve permitir remover um MASTER', () => {
        render(<TeamTab team={mockTeam} currentCompanyId="comp-1" loadTeamData={vi.fn()} user={mockUser} />);

        // MASTER (user-1) não deve ter o botão de trash2, mas sim uma div com ShieldCheck
        const masterRow = screen.getByText('Owner').closest('div[class*="flex-col"]');
        
        // Verifica se tem apenas um botão (o de edit)
        const buttons = masterRow?.querySelectorAll('button');
        expect(buttons?.length).toBe(1);
        
        // Verifica se tem a div com o título de Master
        expect(masterRow?.querySelector('div[title*="Master"]')).toBeInTheDocument();
    });
});
