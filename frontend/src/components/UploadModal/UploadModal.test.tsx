import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadModal } from './index';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKING DA API E TOAST
// ==========================================
vi.mock('../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
        upload: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// ==========================================
// 🏭 FÁBRICA DE DADOS (Catálogo Falso)
// ==========================================
const mockCatalog = [
    {
        id: 'cat-1',
        name: 'Categoria Legal',
        types: [
            { id: 'type-1', name: 'Contrato Social' },
            { id: 'type-2', name: 'Alvará de Funcionamento' }
        ]
    }
];

describe('UploadModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const targetCompanyId = 'empresa-123';

    beforeEach(() => {
        vi.clearAllMocks();
        // Por padrão, a API devolve o catálogo com sucesso
        (documentService.getTypes as any).mockResolvedValue(mockCatalog);
    });

    it('não deve renderizar nada se isOpen for false', () => {
        render(
            <UploadModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                targetCompanyId={targetCompanyId}
            />
        );
        expect(screen.queryByText('Novo Upload')).not.toBeInTheDocument();
    });

    it('deve buscar e renderizar o catálogo de tipos ao abrir', async () => {
        render(
            <UploadModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                targetCompanyId={targetCompanyId}
            />
        );

        // Verifica se chamou a API no useEffect
        expect(documentService.getTypes).toHaveBeenCalledTimes(1);

        // Espera as opções do OptGroup aparecerem na tela
        await waitFor(() => {
            // Buscamos o <optgroup> pelo seu papel na acessibilidade (group) e pelo seu rótulo!
            expect(screen.getByRole('group', { name: 'Categoria Legal' })).toBeInTheDocument();

            // As opções normais podem continuar a ser buscadas por texto
            expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        });
    });

    it('deve exibir erros de validação se tentar enviar o formulário vazio', async () => {
        const user = userEvent.setup();
        render(
            <UploadModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} targetCompanyId={targetCompanyId} />
        );

        // Clica direto no botão de enviar
        await user.click(screen.getByText('Enviar para o Cofre'));

        // O React Hook Form é assíncrono, então usamos await findByText para erros de validação
        expect(await screen.findByText('Arquivo é obrigatório')).toBeInTheDocument();
        expect(await screen.findByText('Tipo é obrigatório')).toBeInTheDocument();

        // A API de upload NÃO pode ter sido chamada!
        expect(documentService.upload).not.toHaveBeenCalled();
    });

    it('deve realizar o upload com sucesso e limpar o formulário (Caminho Feliz)', async () => {
        const user = userEvent.setup();
        (documentService.upload as any).mockResolvedValueOnce({ id: 'novo-doc' });

        render(
            <UploadModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} targetCompanyId={targetCompanyId} />
        );

        // 1. Espera o catálogo carregar
        await waitFor(() => expect(screen.getByText('Contrato Social')).toBeInTheDocument());

        // 2. Simula o upload de um ficheiro (PDF falso)
        const fileInput = screen.getByLabelText(/Arquivo PDF/i);
        const fakeFile = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
        await user.upload(fileInput, fakeFile);

        // 3. Seleciona o Tipo de Documento no Select
        // Pegamos o select pelo combobox e escolhemos o value 'type-1'
        const select = screen.getByRole('combobox');
        await user.selectOptions(select, 'type-1');

        // 4. Preenche os campos opcionais da Sprint 17
        await user.type(screen.getByLabelText('Cód. Autenticação'), 'XYZ-123');
        // Preencher input de data (ano-mês-dia)
        // Como você usa um Input customizado, o getByLabelText deve funcionar se o htmlFor estiver correto
        const dateInput = screen.getByLabelText('Data de Validade');
        await user.type(dateInput, '2025-12-31');

        // 5. Submete
        await user.click(screen.getByText('Enviar para o Cofre'));

        // 6. Validações Pós-Upload
        await waitFor(() => {
            // Verifica se a API foi chamada com os parâmetros corretos
            expect(documentService.upload).toHaveBeenCalledWith(
                fakeFile, // O ficheiro simulado
                'empresa-123', // O targetCompanyId
                {
                    typeId: 'type-1',
                    expirationDate: '2025-12-31',
                    authenticationCode: 'XYZ-123'
                }
            );

            // Verifica se a notificação de sucesso apareceu
            expect(toast.success).toHaveBeenCalledWith('Documento enviado com sucesso para o Cofre!');

            // Verifica se chamou as funções de callback
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('deve exibir toast de erro se a API de upload falhar', async () => {
        const user = userEvent.setup();

        // Blindagem Sênior: Retornamos a rejeição exata dentro de um mockImplementation
        (documentService.upload as any).mockImplementationOnce(() =>
            Promise.reject({
                response: { data: { detail: 'Arquivo corrompido' } }
            })
        );

        render(
            <UploadModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} targetCompanyId={targetCompanyId} />
        );

        await waitFor(() => expect(screen.getByText('Contrato Social')).toBeInTheDocument());

        const fakeFile = new File(['peso-do-arquivo'], 'test.pdf', { type: 'application/pdf' });
        await user.upload(screen.getByLabelText(/Arquivo PDF/i), fakeFile);
        await user.selectOptions(screen.getByRole('combobox'), 'type-2');

        await user.click(screen.getByText('Enviar para o Cofre'));

        await waitFor(() => {
            expect(documentService.upload).toHaveBeenCalled();
            // Agora a propriedade detail sobreviverá até ao catch!
            expect(toast.error).toHaveBeenCalledWith('Arquivo corrompido');
            expect(mockOnSuccess).not.toHaveBeenCalled();
        });
    });
});