import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanySettings } from './index';
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import api from '../../../services/api';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE SERVIÇOS
// ==========================================
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../services/companyService', () => ({
    companyService: {
        getById: vi.fn(),
        update: vi.fn(),
        getTeam: vi.fn(),
        inviteMember: vi.fn(),
    },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        upload: vi.fn(),
    },
}));

vi.mock('../../../services/api', () => ({
    default: {
        patch: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn().mockReturnValue('toast-id'),
    },
}));

// Dados Falsos
const mockCompany = {
    id: 'comp-123',
    razao_social: 'Empresa Cliente LTDA',
    cnpj: '12345678000100',
    email_corporativo: 'contato@cliente.com',
    is_contract_signed: true,
    is_payment_active: true,
    is_admin_verified: false, // Status pendente
};

const mockTeam = [
    { user_id: 'user-1', email: 'admin@cliente.com', name: 'Admin Silva', role: 'ADMIN' },
    { user_id: 'user-2', email: 'viewer@cliente.com', name: 'Viewer Costa', role: 'VIEWER' },
];

describe('CompanySettings Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            currentCompany: mockCompany,
            user: { sub: 'admin@cliente.com' } // JWT subject (email)
        });
    });

    // --- ABA 1: DADOS CADASTRAIS (Padrão) ---

    it('deve carregar os dados cadastrais e o status da empresa na aba inicial', async () => {
        (companyService.getById as any).mockResolvedValueOnce(mockCompany);

        render(<CompanySettings />);

        // Verifica Título
        expect(screen.getByText('Configurações')).toBeInTheDocument();
        expect(screen.getByText(/Gerencie os dados da/)).toBeInTheDocument();

        await waitFor(() => {
            // Verifica se a API foi chamada
            expect(companyService.getById).toHaveBeenCalledWith('comp-123');

            // Verifica o preenchimento do CNPJ inativo
            expect(screen.getByDisplayValue('12345678000100')).toBeInTheDocument();

            // Verifica os widgets de status
            expect(screen.getByText('Assinado')).toBeInTheDocument();
            expect(screen.getByText('Ativo')).toBeInTheDocument();
            expect(screen.getByText('Em análise')).toBeInTheDocument();
        });
    });

    it('deve permitir salvar alterações nos dados cadastrais', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValueOnce(mockCompany);
        (companyService.update as any).mockResolvedValueOnce({});

        render(<CompanySettings />);
        await waitFor(() => expect(companyService.getById).toHaveBeenCalled());

        // Encontra o input usando o placeholder nativo do componente Input (ou aria-label se você tiver)
        // Como o Input do seu projeto usa "label", vamos buscar pelo valor preenchido ou alterar o campo
        const inputNomeFantasia = screen.getByLabelText('Nome Fantasia');
        await user.type(inputNomeFantasia, 'Cliente Store');

        // Submete
        await user.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

        await waitFor(() => {
            expect(companyService.update).toHaveBeenCalledWith('comp-123', expect.objectContaining({
                nome_fantasia: 'Cliente Store'
            }));
            expect(toast.success).toHaveBeenCalledWith('Dados da empresa atualizados!');
        });
    });

    // --- ABA 2: DOCUMENTAÇÃO ---

    it('deve navegar para a aba Documentação e simular um re-upload', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValue(mockCompany);
        (documentService.upload as any).mockResolvedValueOnce({});

        render(<CompanySettings />);
        await waitFor(() => expect(companyService.getById).toHaveBeenCalled());

        // Muda de aba
        await user.click(screen.getByRole('button', { name: /Documentação/i }));

        await waitFor(() => {
            expect(screen.getByText('Cartão CNPJ')).toBeInTheDocument();
        });

        // Simula o upload de um arquivo. Como o input[type="file"] está escondido (hidden), precisamos contornar isso
        const file = new File(['dummy content'], 'cartao.pdf', { type: 'application/pdf' });

        // Pega todos os inputs de arquivo da tela
        const fileInputs = document.querySelectorAll('input[type="file"]');
        const cartaoCnpjInput = fileInputs[1] as HTMLInputElement; // O segundo é o do Cartão CNPJ

        await user.upload(cartaoCnpjInput, file);

        await waitFor(() => {
            expect(documentService.upload).toHaveBeenCalledWith(file, 'Cartão CNPJ', 'comp-123');
            expect(toast.success).toHaveBeenCalledWith('Documento atualizado!', expect.any(Object));
        });
    });

    // --- ABA 3: EQUIPE ---

    it('deve navegar para a aba Equipe, carregar os membros e convidar um novo', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValue(mockCompany);
        (companyService.getTeam as any).mockResolvedValue(mockTeam);
        (companyService.inviteMember as any).mockResolvedValueOnce({ message: 'Convite OK' });

        render(<CompanySettings />);
        await waitFor(() => expect(companyService.getById).toHaveBeenCalled());

        // Muda para a aba Equipe
        await user.click(screen.getByRole('button', { name: /Equipe/i }));

        // Verifica se a API da equipe foi chamada e renderizou
        await waitFor(() => {
            expect(companyService.getTeam).toHaveBeenCalledWith('comp-123');
            expect(screen.getByText('Membros Ativos (2)')).toBeInTheDocument();
            expect(screen.getByText('Admin Silva')).toBeInTheDocument();
        });

        // Testa o convite
        const inputEmail = screen.getByPlaceholderText('email@...');
        await user.type(inputEmail, 'novo@cliente.com');

        await user.click(screen.getByRole('button', { name: /Enviar Convite/i }));

        await waitFor(() => {
            expect(companyService.inviteMember).toHaveBeenCalledWith('comp-123', { email: 'novo@cliente.com', role: 'VIEWER' });
            expect(toast.success).toHaveBeenCalledWith('Convite enviado!', expect.any(Object));
            // Deve recarregar a equipe após convidar
            expect(companyService.getTeam).toHaveBeenCalledTimes(2);
        });
    });

    // --- ABA 4: SEGURANÇA ---

    it('deve navegar para a aba Segurança e alterar a senha com sucesso', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValue(mockCompany);
        (api.patch as any).mockResolvedValueOnce({});

        render(<CompanySettings />);
        await waitFor(() => expect(companyService.getById).toHaveBeenCalled());

        // Muda para a aba Segurança
        await user.click(screen.getByRole('button', { name: /Segurança/i }));

        await waitFor(() => {
            expect(screen.getByText(/Atualize a senha de acesso do seu usuário/)).toBeInTheDocument();
        });

        // Preenche as senhas
        const inputSenha = screen.getByLabelText('Nova Senha');
        const inputConfirmar = screen.getByLabelText('Confirmar Nova Senha');

        await user.type(inputSenha, 'NovaSenhaForte123');
        await user.type(inputConfirmar, 'NovaSenhaForte123');

        // Submete
        await user.click(screen.getByRole('button', { name: /Atualizar Senha/i }));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/users/me', { password: 'NovaSenhaForte123' });
            expect(toast.success).toHaveBeenCalledWith('Senha alterada com sucesso!');
        });
    });

    it('deve exibir erro se as senhas não coincidirem na aba Segurança', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValue(mockCompany);

        render(<CompanySettings />);
        await waitFor(() => expect(companyService.getById).toHaveBeenCalled());

        await user.click(screen.getByRole('button', { name: /Segurança/i }));

        const inputSenha = screen.getByLabelText('Nova Senha');
        const inputConfirmar = screen.getByLabelText('Confirmar Nova Senha');

        await user.type(inputSenha, 'SenhaForte123');
        await user.type(inputConfirmar, 'SenhaDiferente999');

        await user.click(screen.getByRole('button', { name: /Atualizar Senha/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('As senhas não coincidem.');
            expect(api.patch).not.toHaveBeenCalled(); // Não deve chamar a API
        });
    });
});