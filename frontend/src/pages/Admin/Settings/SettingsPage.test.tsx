import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsPage } from './index';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn(),
        createType: vi.fn(),
        updateType: vi.fn(),
        deleteType: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

// Dados Falsos
const mockCategories = [
    {
        id: 'cat-1',
        name: 'Habilitação Jurídica',
        slug: 'hab_juridica',
        order: 1,
        types: [
            {
                id: 'type-1',
                name: 'Contrato Social',
                slug: 'contrato_social',
                validity_days_default: 0,
                description: 'Cópia autenticada'
            }
        ]
    }
];

describe('SettingsPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock padrão do confirm para aceitar exclusões
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    });

    it('deve carregar e listar as categorias e documentos corretamente', async () => {
        (documentService.getTypes as any).mockResolvedValueOnce(mockCategories);

        render(<SettingsPage />);

        // Verifica o estado de loading inicial
        expect(screen.getByText('A carregar catálogo...')).toBeInTheDocument();

        // Aguarda os dados aparecerem na tela
        await waitFor(() => {
            expect(screen.getByText('Habilitação Jurídica')).toBeInTheDocument();
            expect(screen.getByText('Contrato Social')).toBeInTheDocument();
            expect(screen.getByText('Validade: Permanente')).toBeInTheDocument();
        });
    });

    it('deve exibir mensagem de vazio se não houver categorias', async () => {
        (documentService.getTypes as any).mockResolvedValueOnce([]);

        render(<SettingsPage />);

        await waitFor(() => {
            expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
        });
    });

    // --- TESTES DE CATEGORIA ---

    it('deve abrir o modal de Nova Categoria e salvar com sucesso', async () => {
        const user = userEvent.setup();
        (documentService.getTypes as any).mockResolvedValue(mockCategories);
        (documentService.createCategory as any).mockResolvedValueOnce({});

        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText('Habilitação Jurídica')).toBeInTheDocument());

        // Clica no botão de Nova Categoria
        await user.click(screen.getByRole('button', { name: /Nova Categoria/i }));

        // Verifica se o modal abriu e preenche
        expect(screen.getByRole('heading', { name: 'Nova Categoria' })).toBeInTheDocument(); // Título do modal

        const nameInput = screen.getByPlaceholderText('Ex: Habilitação Jurídica');
        const slugInput = screen.getByPlaceholderText('Ex: habilitacao_juridica');

        await user.type(nameInput, 'Fiscal');
        await user.type(slugInput, 'fiscal');

        // Submete
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => {
            expect(documentService.createCategory).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Fiscal',
                slug: 'fiscal'
            }));
            expect(toast.success).toHaveBeenCalledWith('Categoria criada!');
        });
    });

    it('deve excluir uma categoria quando confirmado', async () => {
        const user = userEvent.setup();
        (documentService.getTypes as any).mockResolvedValue(mockCategories);
        (documentService.deleteCategory as any).mockResolvedValueOnce({});

        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText('Habilitação Jurídica')).toBeInTheDocument());

        // Pega todos os botões de lixeira (o primeiro é da categoria, o segundo é do documento)
        const deleteBtns = screen.getAllByTitle('Apagar Categoria');
        await user.click(deleteBtns[0]);

        expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja apagar a categoria "Habilitação Jurídica"? Isso só será possível se ela estiver vazia.');

        await waitFor(() => {
            expect(documentService.deleteCategory).toHaveBeenCalledWith('cat-1');
            expect(toast.success).toHaveBeenCalledWith('Categoria apagada com sucesso!');
        });
    });

    // --- TESTES DE TIPOS DE DOCUMENTO ---

    it('deve abrir o modal de Novo Documento e salvar com sucesso', async () => {
        const user = userEvent.setup();
        (documentService.getTypes as any).mockResolvedValue(mockCategories);
        (documentService.createType as any).mockResolvedValueOnce({});

        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText('Habilitação Jurídica')).toBeInTheDocument());

        // Clica em "Adicionar Documento à Habilitação Jurídica"
        await user.click(screen.getByRole('button', { name: /Adicionar Documento à/i }));

        // Modal aberto
        expect(screen.getByText('Novo Documento')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'CND Municipal');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'cnd_municipal');

        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => {
            expect(documentService.createType).toHaveBeenCalledWith(expect.objectContaining({
                name: 'CND Municipal',
                slug: 'cnd_municipal',
                category_id: 'cat-1'
            }));
            expect(toast.success).toHaveBeenCalledWith('Documento adicionado à categoria!');
        });
    });
});