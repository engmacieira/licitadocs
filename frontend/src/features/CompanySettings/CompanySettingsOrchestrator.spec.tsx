import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanySettingsOrchestrator } from './CompanySettingsOrchestrator';
import { companyService } from '../../services/companyService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Mocking services and hooks
vi.mock('../../services/companyService', () => ({
    companyService: {
        getById: vi.fn(),
        update: vi.fn(),
        getTeam: vi.fn(),
        inviteMember: vi.fn(),
        updateMemberRole: vi.fn(),
        removeMember: vi.fn(),
    }
}));

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(() => 'toast-id'),
    }
}));

const mockUser = { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN' };
const mockCompany = {
    id: 'comp-1',
    cnpj: '12.345.678/0001-99',
    razao_social: 'Empresa Teste LTDA',
    is_data_completed: true,
    is_contract_signed: false,
    is_payment_active: true,
    is_admin_verified: false
};

const mockTeam = [
    { user_id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'MASTER', status: true }
];

describe('CompanySettingsOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser as any,
            userProfile: {} as any,
            currentCompany: mockCompany as any,
            companies: [mockCompany] as any,
            isAuthenticated: true,
            loading: false,
            signOut: vi.fn(),
            signIn: vi.fn(),
            switchCompany: vi.fn(),
            reloadContext: vi.fn().mockResolvedValue(undefined)
        });
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(api.get).mockImplementation((url) => {
            if (url === '/users/me') return Promise.resolve({ data: mockUser });
            if (url.includes('/documents/')) return Promise.resolve({ data: [] });
            return Promise.reject(new Error('not found'));
        });
        vi.mocked(companyService.getTeam).mockResolvedValue(mockTeam as any);

        // Mock fetch for IBGE
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve([])
        }));
    });

    it('deve carregar dados iniciais e renderizar aba Detalhes (default)', async () => {
        render(<CompanySettingsOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Configurações')).toBeInTheDocument();
            expect(screen.getByText('Dados Cadastrais')).toBeInTheDocument();
            expect(screen.getByDisplayValue(mockCompany.cnpj)).toBeInTheDocument();
        });

        expect(companyService.getById).toHaveBeenCalledWith('comp-1');
    });

    it('deve alternar para aba Perfil e carregar dados do usuário', async () => {
        render(<CompanySettingsOrchestrator />);

        await waitFor(() => expect(screen.getByText('Dados Cadastrais')).toBeInTheDocument());

        const profileTab = screen.getByRole('button', { name: /Perfil/i });
        fireEvent.click(profileTab);

        await waitFor(() => {
            expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        });
    });

    it('deve alternar para aba Equipe e carregar lista de membros', async () => {
        render(<CompanySettingsOrchestrator />);

        await waitFor(() => expect(screen.getByText('Dados Cadastrais')).toBeInTheDocument());

        const teamTab = screen.getByRole('button', { name: /Equipe/i });
        fireEvent.click(teamTab);

        await waitFor(() => {
            expect(screen.getByText('Membros Ativos (1)')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });

        expect(companyService.getTeam).toHaveBeenCalledWith('comp-1');
    });

    it('deve alternar para aba Documentos e carregar lista de documentos', async () => {
        vi.mocked(api.get).mockImplementation((url) => {
            if (url === '/users/me') return Promise.resolve({ data: mockUser });
            if (url.includes('/documents/')) return Promise.resolve({ data: [{ id: 'doc-1', title: 'Doc Teste', filename: 'test.pdf' }] });
            return Promise.reject(new Error('not found'));
        });

        render(<CompanySettingsOrchestrator />);

        await waitFor(() => expect(screen.getByText('Dados Cadastrais')).toBeInTheDocument());

        const docsTab = screen.getByRole('button', { name: /Documentação/i });
        fireEvent.click(docsTab);

        await waitFor(() => {
            expect(screen.getByText('1 Arquivos')).toBeInTheDocument();
            expect(screen.getByText('Doc Teste')).toBeInTheDocument();
        });
    });

    it('deve chamar companyService.update ao salvar alterações da empresa', async () => {
        vi.mocked(companyService.update).mockResolvedValue({} as any);
        render(<CompanySettingsOrchestrator />);

        await waitFor(() => expect(screen.getByText('Informações Gerais')).toBeInTheDocument());

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(companyService.update).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Dados da empresa atualizados com sucesso!');
        });
    });
});
