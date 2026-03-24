import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryModal } from './CategoryModal';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// Mock do serviço e do toast
vi.mock('../../../services/documentService', () => ({
    documentService: {
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('CategoryModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        initialData: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar corretamente para nova categoria', () => {
        render(<CategoryModal {...defaultProps} />);
        
        expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Habilitação Jurídica')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: habilitacao_juridica')).toBeInTheDocument();
        expect(screen.getByText('Ordem de Exibição')).toBeInTheDocument();
    });

    it('deve renderizar corretamente para edição de categoria', () => {
        const initialData = {
            id: '1',
            name: 'Cat 1',
            slug: 'cat-1',
            order: 5,
            types: []
        };
        render(<CategoryModal {...defaultProps} initialData={initialData} />);
        
        expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cat 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('cat-1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('deve exibir erro de validação se campos obrigatórios estiverem vazios', async () => {
        render(<CategoryModal {...defaultProps} />);
        
        const saveButton = screen.getByRole('button', { name: /Salvar/i });
        const user = userEvent.setup();
        
        // Limpar campos que podem ter defaults (order tem default 0, slug/name estão vazios)
        // Precisamos forçar o erro no name que é obrigatório
        await user.click(saveButton);

        await waitFor(() => {
            const errors = screen.getAllByText('Obrigatório');
            expect(errors.length).toBeGreaterThan(0);
        });
        
        expect(documentService.createCategory).not.toHaveBeenCalled();
    });

    it('deve chamar documentService.createCategory com sucesso', async () => {
        vi.mocked(documentService.createCategory).mockResolvedValue({ id: 'new-id', name: 'Nova', slug: 'nova', order: 1, types: [] });
        
        render(<CategoryModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('Ex: Habilitação Jurídica'), 'Habilitação');
        await user.type(screen.getByPlaceholderText('Ex: habilitacao_juridica'), 'habilitacao');
        
        // Selecionar o input de ordem pelo papel (spinbutton para type="number")
        const orderInput = screen.getByRole('spinbutton');
        await user.clear(orderInput);
        await user.type(orderInput, '10');

        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(documentService.createCategory).toHaveBeenCalledWith({
                name: 'Habilitação',
                slug: 'habilitacao',
                order: 10
            });
        });

        expect(toast.success).toHaveBeenCalledWith('Categoria criada!');
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve chamar documentService.updateCategory com sucesso', async () => {
        const initialData = { id: '1', name: 'Cat 1', slug: 'cat-1', order: 5, types: [] };
        vi.mocked(documentService.updateCategory).mockResolvedValue({ ...initialData, name: 'Cat Updated' });
        
        render(<CategoryModal {...defaultProps} initialData={initialData} />);
        const user = userEvent.setup();

        const nameInput = screen.getByDisplayValue('Cat 1');
        await user.clear(nameInput);
        await user.type(nameInput, 'Cat Updated');

        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(documentService.updateCategory).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'Cat Updated'
            }));
        });

        expect(toast.success).toHaveBeenCalledWith('Categoria atualizada!');
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve exibir erro do toast se a API falhar', async () => {
        const errorMsg = 'Erro na API';
        vi.mocked(documentService.createCategory).mockRejectedValue({
            response: { data: { detail: errorMsg } }
        });
        
        render(<CategoryModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('Ex: Habilitação Jurídica'), 'Habilitação');
        await user.type(screen.getByPlaceholderText('Ex: habilitacao_juridica'), 'habilitacao');
        
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMsg);
        });
    });

    it('deve chamar onClose ao clicar no botão cancelar', async () => {
        render(<CategoryModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: /Cancelar/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve retornar nulo se isOpen for falso', () => {
        const { container } = render(<CategoryModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });
});
