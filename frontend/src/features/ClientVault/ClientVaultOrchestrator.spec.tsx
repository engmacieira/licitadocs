import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { ClientVaultOrchestrator } from './ClientVaultOrchestrator';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        downloadAllValidZip: vi.fn(),
    },
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

const mockDocuments = [
    {
        id: '1',
        filename: 'certidao_negativa.pdf',
        title: 'Certidão Negativa de Débitos',
        status: 'valid',
        category_name: 'Fiscal',
        type_name: 'Certidão Federal',
        is_structured: true,
        is_client_upload: false,
        created_at: '2024-01-01T10:00:00Z',
    },
    {
        id: '2',
        filename: 'alvara_funcionamento.pdf',
        title: 'Alvará de Funcionamento',
        status: 'warning',
        category_name: 'Municipal',
        type_name: 'Alvará',
        is_structured: true,
        is_client_upload: false,
        created_at: '2024-01-02T10:00:00Z',
    },
    {
        id: '3',
        filename: 'pendente_validacao.pdf',
        title: 'Documento Enviado pelo Cliente',
        status: 'pending',
        category_name: 'Outros',
        is_structured: false,
        is_client_upload: true, // Deve ser filtrado/escondido
        created_at: '2024-01-03T10:00:00Z',
    },
];

describe('ClientVaultOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { role: 'client' },
            currentCompany: { id: 'company-123' },
        });
    });

    it('deve exibir o estado de loading inicial', async () => {
        (documentService.getAll as any).mockReturnValue(new Promise(() => { })); // Nunca resolve para testar loading

        render(<ClientVaultOrchestrator />);

        // Verifica se existem Skeletons (o orchestrator renderiza 3)
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve carregar e exibir a lista de documentos (filtrando uploads do cliente)', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
            expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        });

        // O documento 3 não deve aparecer pois is_client_upload é true
        expect(screen.queryByText('Documento Enviado pelo Cliente')).not.toBeInTheDocument();
    });

    it('deve exibir erro (toast) se a chamada ao serviço falhar', async () => {
        (documentService.getAll as any).mockRejectedValue(new Error('API Error'));

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar os documentos do cofre.");
        });
    });

    it('deve filtrar a lista quando o usuário digita na busca', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        const user = userEvent.setup();

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Buscar documentos...');
        await user.type(input, 'Alvará');

        expect(screen.queryByText('Certidão Negativa de Débitos')).not.toBeInTheDocument();
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
    });

    it('deve exibir VaultEmptyState quando nenhum documento corresponde à busca', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        const user = userEvent.setup();

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Buscar documentos...');
        await user.type(input, 'inexistente');

        expect(screen.getByText('Nenhum documento encontrado')).toBeInTheDocument();
        expect(screen.getByText(/Não encontramos resultados para "inexistente"/)).toBeInTheDocument();
    });

    it('deve limpar a busca e restaurar a lista ao clicar em "Limpar busca"', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        const user = userEvent.setup();

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Buscar documentos...');
        await user.type(input, 'inexistente');

        const clearButton = screen.getByRole('button', { name: /Limpar busca/ });
        await user.click(clearButton);

        expect(input).toHaveValue('');
        expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
    });

    it('deve aguardar a empresa estar disponível antes de carregar dados (se não for admin)', async () => {
        (useAuth as any).mockReturnValue({
            user: { role: 'client' },
            currentCompany: null, // Empresa ainda não carregada
        });

        render(<ClientVaultOrchestrator />);

        expect(documentService.getAll).not.toHaveBeenCalled();
    });

    it('deve carregar dados sem empresa se o usuário for admin', async () => {
        (useAuth as any).mockReturnValue({
            user: { role: 'admin' },
            currentCompany: null,
        });
        (documentService.getAll as any).mockResolvedValue([]);

        render(<ClientVaultOrchestrator />);

        expect(documentService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('deve acionar o download do ZIP e exibir toast de sucesso', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        (documentService.downloadAllValidZip as any).mockResolvedValue(undefined);
        const user = userEvent.setup();

        render(<ClientVaultOrchestrator />);

        // Aguarda a renderização dos documentos
        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
        });

        const downloadBtn = screen.getByRole('button', { name: /Baixar Tudo/i });
        await user.click(downloadBtn);

        // Verifica se chamou a função do serviço com os parâmetros corretos
        expect(documentService.downloadAllValidZip).toHaveBeenCalledWith('company-123', expect.any(String));

        // Verifica o toast
        expect(toast.success).toHaveBeenCalledWith("Download do pacote concluído!");
    });

    it('deve exibir toast de erro se o download do ZIP falhar', async () => {
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        (documentService.downloadAllValidZip as any).mockRejectedValue(new Error('Network Error'));
        const user = userEvent.setup();

        render(<ClientVaultOrchestrator />);

        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa de Débitos')).toBeInTheDocument();
        });

        const downloadBtn = screen.getByRole('button', { name: /Baixar Tudo/i });
        await user.click(downloadBtn);

        expect(toast.error).toHaveBeenCalledWith("Não foi possível gerar o arquivo ZIP. Tente novamente.");
    });
});
