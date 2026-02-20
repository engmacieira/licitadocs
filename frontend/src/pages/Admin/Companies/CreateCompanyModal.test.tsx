import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCompanyModal } from './CreateCompanyModal';
import { companyService } from '../../../services/companyService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../services/companyService', () => ({
    companyService: {
        create: vi.fn(),
        update: vi.fn(),
        getAll: vi.fn(),
        getById: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('CreateCompanyModal Integration', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar nada se isOpen for false', () => {
        const { container } = render(
            <CreateCompanyModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('deve permitir criar uma nova empresa com sucesso', async () => {
        const user = userEvent.setup();

        // 🚀 TypeScript Feliz: Usamos vi.mocked para avisar que é uma função mockada
        vi.mocked(companyService.create).mockResolvedValueOnce({});

        render(
            <CreateCompanyModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
        );

        expect(screen.getByText('Nova Empresa')).toBeInTheDocument();

        // ⚠️ Nota: Confirme se os seus <Input> no componente têm id="name" e id="cnpj"
        const nameInput = screen.getByLabelText(/Razão Social/i);
        const cnpjInput = screen.getByLabelText(/CNPJ/i);

        await user.type(nameInput, 'Nova Empresa S/A');
        await user.type(cnpjInput, '12345678000199');

        await user.click(screen.getByRole('button', { name: 'Cadastrar Empresa' }));

        await waitFor(() => {
            expect(companyService.create).toHaveBeenCalledWith({
                name: 'Nova Empresa S/A',
                cnpj: '12345678000199',
            });
            expect(toast.success).toHaveBeenCalledWith('Empresa cadastrada com sucesso!');
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('deve preencher os dados no modo Edição e desativar o CNPJ', async () => {
        const user = userEvent.setup();
        vi.mocked(companyService.update).mockResolvedValueOnce({} as any);

        // 👇 AQUI ESTÁ O SEGREDO: Mude 'name' para 'razao_social' (ou a propriedade correta da sua interface Company)
        const mockCompany = {
            id: 'comp-789',
            razao_social: 'Empresa Editada',
            cnpj: '99999999000199'
        };

        render(
            <CreateCompanyModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                companyToEdit={mockCompany as any}
            />
        );

        expect(screen.getByText('Editar Empresa')).toBeInTheDocument();

        const nameInput = screen.getByLabelText(/Razão Social/i);
        const cnpjInput = screen.getByLabelText(/CNPJ/i);

        expect(nameInput).toHaveValue('Empresa Editada');
        expect(cnpjInput).toHaveValue('99999999000199');
        expect(cnpjInput).toBeDisabled();

        await user.clear(nameInput);
        await user.type(nameInput, 'Empresa Renomeada');
        await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

        await waitFor(() => {
            // O teste agora sabe que o update envia apenas 'razao_social'
            expect(companyService.update).toHaveBeenCalledWith('comp-789', {
                razao_social: 'Empresa Renomeada'
            });
            expect(toast.success).toHaveBeenCalledWith('Empresa atualizada com sucesso!');
        });
    });
});