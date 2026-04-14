import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsOrchestrator } from './SettingsOrchestrator';
import { documentService } from '../../services/documentService';
import type { DocumentScope } from '../../types';
import { toast } from 'sonner';

// Mock do serviço e do toast
vi.mock('../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
        deleteCategory: vi.fn(),
        deleteType: vi.fn(),
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

const mockCategories = [
    {
        id: 'cat-1',
        name: 'Jurídico',
        slug: 'juridico',
        order: 1,
        types: [
            {
                id: 'type-1',
                name: 'Contrato Social',
                slug: 'contrato-social',
                scope: 'NATIONAL' as DocumentScope,
                validity_days_default: 0,
                description: 'Docs da empresa'
            }
        ]
    }
];

describe('SettingsOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global de confirmação
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    it('deve exibir carregamento inicialmente e depois a lista', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        
        render(<SettingsOrchestrator />);
        
        expect(screen.getByText('A carregar catálogo...')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Jurídico')).toBeInTheDocument();
            expect(screen.getByText('Contrato Social')).toBeInTheDocument();
        });
    });

    it('deve exibir estado vazio se não houver categorias', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue([]);
        
        render(<SettingsOrchestrator />);
        
        await waitFor(() => {
            expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
        });
    });

    it('deve abrir o modal de nova categoria ao clicar no botão', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue([]);
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        const newCatBtn = await screen.findByRole('button', { name: /Nova Categoria/i });
        await user.click(newCatBtn);

        // Usar heading para evitar conflito com o texto do botão
        expect(screen.getByRole('heading', { name: 'Nova Categoria' })).toBeInTheDocument();
    });

    it('deve abrir o modal de edição de categoria', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        const editBtn = await screen.findByTitle('Editar Categoria');
        await user.click(editBtn);

        expect(screen.getByRole('heading', { name: 'Editar Categoria' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jurídico')).toBeInTheDocument();
    });

    it('deve excluir uma categoria após confirmação', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        vi.mocked(documentService.deleteCategory).mockResolvedValue(undefined);
        
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        await waitFor(() => screen.getByTitle('Apagar Categoria'));
        await user.click(screen.getByTitle('Apagar Categoria'));

        expect(window.confirm).toHaveBeenCalled();
        expect(documentService.deleteCategory).toHaveBeenCalledWith('cat-1');
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Categoria apagada com sucesso!');
        });
        
        // Deve recarregar os dados
        expect(documentService.getTypes).toHaveBeenCalledTimes(2);
    });

    it('não deve excluir categoria se o usuário cancelar a confirmação', async () => {
        vi.stubGlobal('confirm', vi.fn(() => false));
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        await waitFor(() => screen.getByTitle('Apagar Categoria'));
        await user.click(screen.getByTitle('Apagar Categoria'));

        expect(window.confirm).toHaveBeenCalled();
        expect(documentService.deleteCategory).not.toHaveBeenCalled();
    });

    it('deve excluir um tipo de documento após confirmação', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        vi.mocked(documentService.deleteType).mockResolvedValue(undefined);
        
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        await waitFor(() => screen.getByText('Contrato Social'));
        
        // Buscar o container do tipo (div com classe group que contém o texto)
        const typeCard = screen.getByText('Contrato Social').closest('.group');
        const actionButtons = typeCard?.querySelectorAll('button');
        const deleteBtn = actionButtons?.[1]; // 0=Edit, 1=Delete

        if (deleteBtn) {
            await user.click(deleteBtn);
        } else {
            throw new Error(`Botão de excluir tipo não encontrado. Botões totais no card: ${actionButtons?.length}`);
        }

        expect(window.confirm).toHaveBeenCalled();
        expect(documentService.deleteType).toHaveBeenCalledWith('type-1');
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Tipo de documento apagado com sucesso!');
        });
    });

    it('deve abrir modal de novo tipo de documento e passar categoryId', async () => {
        vi.mocked(documentService.getTypes).mockResolvedValue(mockCategories);
        render(<SettingsOrchestrator />);
        const user = userEvent.setup();

        const addBtn = await screen.findByText(/Adicionar Documento à Jurídico/i);
        await user.click(addBtn);

        expect(screen.getByRole('heading', { name: 'Novo Documento' })).toBeInTheDocument();
    });

    it('deve exibir erro do toast se a carga inicial falhar', async () => {
        vi.mocked(documentService.getTypes).mockRejectedValue(new Error('Falha'));
        
        render(<SettingsOrchestrator />);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar o catálogo de documentos.');
        });
    });
});
