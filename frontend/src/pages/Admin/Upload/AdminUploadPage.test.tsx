import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUploadPage } from './index';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS DE SERVIÇOS
// ==========================================
vi.mock('../../../services/companyService', () => ({
    companyService: { getAll: vi.fn() },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: { getAll: vi.fn() },
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn() },
}));

// ==========================================
// 🎭 MOCKS DE COMPONENTES FILHOS
// ==========================================
// Simulamos o Cofre para não dependermos da sua lógica interna neste teste
vi.mock('../../../components/CompanyVault', () => ({
    CompanyVault: () => <div data-testid="company-vault">Cofre Digital Renderizado</div>
}));

// Simulamos o Modal de Upload e criamos um botão falso para testar a função de "onSuccess"
vi.mock('../../../components/UploadModal', () => ({
    UploadModal: ({ isOpen, onSuccess }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="upload-modal">
                <button onClick={onSuccess}>Simular Upload com Sucesso</button>
            </div>
        );
    }
}));

// Dados Falsos
const mockCompanies = [
    { id: 'comp-1', razao_social: 'Empresa Alpha', cnpj: '11111111000111' },
    { id: 'comp-2', name: 'Empresa Beta', cnpj: '22222222000122' } // Usa 'name' em vez de 'razao_social'
];

describe('AdminUploadPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve carregar a lista de empresas e exibir o estado vazio inicial', async () => {
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        render(<AdminUploadPage />);

        // Verifica o título principal
        expect(screen.getByText('Central de Documentos')).toBeInTheDocument();

        // Aguarda a API de empresas responder
        await waitFor(() => {
            expect(companyService.getAll).toHaveBeenCalled();
        });

        // Verifica o estado inicial (sem empresa selecionada)
        expect(screen.getByText('Nenhuma empresa selecionada')).toBeInTheDocument();
        expect(screen.getByText(/Utilize o seletor acima para carregar/i)).toBeInTheDocument();

        // Verifica se o dropdown foi preenchido corretamente
        expect(screen.getByRole('option', { name: 'Empresa Alpha (11111111000111)' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Empresa Beta (22222222000122)' })).toBeInTheDocument();
    });

    it('deve buscar os documentos e exibir o Cofre ao selecionar uma empresa', async () => {
        const user = userEvent.setup();
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);
        (documentService.getAll as any).mockResolvedValueOnce([]);

        render(<AdminUploadPage />);

        // 1. ESPERA as empresas serem carregadas no select
        // Usamos findByRole porque ele tem um waitFor embutido.
        await screen.findByRole('option', { name: /Empresa Alpha/i });

        // 2. Agora que sabemos que as opções existem, fazemos a seleção
        const selectElement = screen.getByRole('combobox');
        await user.selectOptions(selectElement, 'comp-1');

        await waitFor(() => {
            // Verifica se chamou a API de documentos com o ID correto
            expect(documentService.getAll).toHaveBeenCalledWith('comp-1');

            // O componente CompanyVault deve ter sido renderizado
            expect(screen.getByTestId('company-vault')).toBeInTheDocument();
        });
    });

    it('deve abrir o modal de upload e recarregar os documentos ao fazer upload', async () => {
        const user = userEvent.setup();
        (companyService.getAll as any).mockResolvedValueOnce(mockCompanies);

        // Na primeira vez carrega vazio, na segunda vez finge que carregou um documento
        (documentService.getAll as any)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'doc-1', title: 'Novo Doc' }]);

        render(<AdminUploadPage />);
        await waitFor(() => expect(companyService.getAll).toHaveBeenCalled());

        // 1. Seleciona a empresa
        await user.selectOptions(screen.getByRole('combobox'), 'comp-1');
        await waitFor(() => expect(documentService.getAll).toHaveBeenCalledTimes(1));

        // 2. Clica no botão "Novo Documento"
        await user.click(screen.getByRole('button', { name: /Novo Documento/i }));

        // 3. Verifica se o modal abriu
        expect(screen.getByTestId('upload-modal')).toBeInTheDocument();

        // 4. Simula o sucesso do upload clicando no botão falso que criamos no mock
        await user.click(screen.getByRole('button', { name: 'Simular Upload com Sucesso' }));

        // 5. Verifica se o loadDocuments foi chamado de novo (total de 2 vezes)
        await waitFor(() => {
            expect(documentService.getAll).toHaveBeenCalledTimes(2);
        });
    });
});