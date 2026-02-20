import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DocumentsPage } from './index';
import { useAuth } from '../../../contexts/AuthContext';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE SERVIÇOS
// ==========================================
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

// ==========================================
// 🎭 MOCK DO COMPONENTE FILHO (VAULT)
// ==========================================
vi.mock('../../../components/CompanyVault', () => ({
    // Renderizamos um cofre falso que apenas nos diz quantos documentos recebeu
    CompanyVault: ({ documents }: any) => (
        <div data-testid="company-vault">
            Cofre renderizado com {documents.length} documentos
        </div>
    )
}));

// Dados Falsos
const mockDocuments = [
    {
        id: 'doc-1',
        filename: 'CND_Federal_2026.pdf',
        title: 'Certidão Negativa Federal',
        category_name: 'Fiscal',
        type_name: 'Receita Federal',
        authentication_code: 'AUTH-123'
    },
    {
        id: 'doc-2',
        filename: 'Contrato_Social_V2.pdf',
        title: 'Contrato Social Consolidado',
        category_name: 'Jurídico',
        type_name: 'Contrato',
        authentication_code: 'AUTH-999'
    }
];

describe('DocumentsPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Simulamos o login de um Cliente com uma empresa selecionada
        (useAuth as any).mockReturnValue({
            user: { role: 'client' },
            currentCompany: { id: 'comp-cliente-123' }
        });
    });

    it('deve carregar e renderizar os documentos corretamente no cofre', async () => {
        (documentService.getAll as any).mockResolvedValueOnce(mockDocuments);

        render(
            <MemoryRouter>
                <DocumentsPage />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText('Cofre Digital')).toBeInTheDocument();

        // Aguarda a chamada da API com o ID da empresa do cliente
        await waitFor(() => {
            expect(documentService.getAll).toHaveBeenCalledWith('comp-cliente-123');
        });

        // Verifica se o Cofre Falso recebeu os 2 documentos
        expect(screen.getByTestId('company-vault')).toHaveTextContent('Cofre renderizado com 2 documentos');
    });

    it('deve filtrar os documentos utilizando o Filtro Turbinado (busca em memória)', async () => {
        const user = userEvent.setup();
        (documentService.getAll as any).mockResolvedValueOnce(mockDocuments);

        render(
            <MemoryRouter>
                <DocumentsPage />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByTestId('company-vault')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Buscar documentos...');

        // 1. Testa a busca pelo Título (deve encontrar 1)
        await user.type(searchInput, 'Federal');
        expect(screen.getByTestId('company-vault')).toHaveTextContent('Cofre renderizado com 1 documentos');

        // Limpa a busca
        await user.clear(searchInput);

        // 2. Testa a busca pela Categoria (deve encontrar 1)
        await user.type(searchInput, 'Jurídico');
        expect(screen.getByTestId('company-vault')).toHaveTextContent('Cofre renderizado com 1 documentos');

        // Limpa a busca e garante que voltaram os 2
        await user.clear(searchInput);
        expect(screen.getByTestId('company-vault')).toHaveTextContent('Cofre renderizado com 2 documentos');
    });

    it('deve exibir o estado de "Nenhum resultado" e permitir limpar a busca', async () => {
        const user = userEvent.setup();
        (documentService.getAll as any).mockResolvedValueOnce(mockDocuments);

        render(
            <MemoryRouter>
                <DocumentsPage />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByTestId('company-vault')).toBeInTheDocument());

        // Busca por algo que não existe
        const searchInput = screen.getByPlaceholderText('Buscar documentos...');
        await user.type(searchInput, 'Termo de Posse Inexistente');

        // Verifica a mensagem de "não encontramos resultados"
        expect(screen.getByText('Nenhum documento encontrado')).toBeInTheDocument();
        expect(screen.getByText(/Não encontramos resultados para "Termo de Posse Inexistente"/i)).toBeInTheDocument();

        // Clica no botão de Limpar Busca
        await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

        // O input deve estar vazio e o cofre deve voltar a ter 2 documentos
        expect(searchInput).toHaveValue('');
        expect(screen.getByTestId('company-vault')).toHaveTextContent('Cofre renderizado com 2 documentos');
    });

    it('deve exibir o estado de cofre vazio se a empresa não tiver certidões', async () => {
        (documentService.getAll as any).mockResolvedValueOnce([]); // Retorna array vazio

        render(
            <MemoryRouter>
                <DocumentsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Nenhum documento encontrado')).toBeInTheDocument();
            expect(screen.getByText(/Ainda não há certidões emitidas para sua empresa/i)).toBeInTheDocument();
        });
    });

    it('deve exibir toast de erro se a API falhar', async () => {
        (documentService.getAll as any).mockRejectedValueOnce(new Error('Falha no Servidor'));

        render(
            <MemoryRouter>
                <DocumentsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar os documentos.");
        });
    });
});