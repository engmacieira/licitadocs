import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminCompanyDetails } from './index';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getById: vi.fn(),
        update: vi.fn(),
    },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        downloadDocument: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

// Dados Falsos
const mockCompany = {
    id: 'emp-123',
    razao_social: 'Construtora Teste',
    cnpj: '12345678000100',
    email_corporativo: 'contato@teste.com',
    is_admin_verified: false,
    is_contract_signed: true,
    nome_fantasia: 'Teste Construções',
    logradouro: 'Rua das Flores',
    numero: '100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP'
};

const mockDocuments = [
    {
        id: 'doc-1',
        title: 'Contrato Social',
        filename: 'contrato.pdf',
        created_at: '2026-02-15T10:00:00.000Z'
    }
];

// Helper para renderizar com rota com ID
const renderWithRouter = (ui: React.ReactElement, initialEntry = '/admin/companies/emp-123') => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/admin/companies/:id" element={ui} />
            </Routes>
        </MemoryRouter>
    );
};

describe('AdminCompanyDetails Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock do window.confirm (para testes de aprovação)
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    });

    it('deve carregar e exibir os detalhes da empresa e seus documentos', async () => {
        (companyService.getById as any).mockResolvedValueOnce(mockCompany);
        (documentService.getAll as any).mockResolvedValueOnce(mockDocuments);

        renderWithRouter(<AdminCompanyDetails />);

        // Aguarda o carregamento inicial (Skeleton some)
        await waitFor(() => {
            expect(companyService.getById).toHaveBeenCalledWith('emp-123');
            expect(documentService.getAll).toHaveBeenCalledWith('emp-123');
        });

        // Verifica os dados no ecrã
        expect(screen.getByText('Construtora Teste')).toBeInTheDocument();
        expect(screen.getByText('12345678000100')).toBeInTheDocument();
        expect(screen.getByText('Teste Construções')).toBeInTheDocument();
        expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument();

        // Verifica os documentos
        expect(screen.getByText('Arquivos Enviados (1)')).toBeInTheDocument();
        expect(screen.getByText('Contrato Social')).toBeInTheDocument();
    });

    it('deve aprovar a empresa com sucesso', async () => {
        const user = userEvent.setup();
        (companyService.getById as any)
            .mockResolvedValueOnce(mockCompany) // Primeira carga
            .mockResolvedValueOnce({ ...mockCompany, is_admin_verified: true }); // Segunda carga após recarregar

        (documentService.getAll as any).mockResolvedValue([]);
        (companyService.update as any).mockResolvedValueOnce({});

        renderWithRouter(<AdminCompanyDetails />);

        // Aguarda carregar
        await waitFor(() => expect(screen.getByText('Construtora Teste')).toBeInTheDocument());

        // Clica em Aprovar
        const approveBtn = screen.getByRole('button', { name: /Aprovar Documentação/i });
        await user.click(approveBtn);

        // Verifica se o confirm foi chamado
        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            // Verifica se a atualização foi enviada com a flag correta
            expect(companyService.update).toHaveBeenCalledWith('emp-123', { is_admin_verified: true });
            expect(toast.success).toHaveBeenCalledWith('Empresa aprovada com sucesso!');
        });
    });

    it('NÃO deve aprovar se o administrador cancelar a confirmação', async () => {
        const user = userEvent.setup();
        // O utilizador clica em "Cancelar" no modal do navegador
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

        (companyService.getById as any).mockResolvedValueOnce(mockCompany);
        (documentService.getAll as any).mockResolvedValue([]);

        renderWithRouter(<AdminCompanyDetails />);
        await waitFor(() => expect(screen.getByText('Construtora Teste')).toBeInTheDocument());

        const approveBtn = screen.getByRole('button', { name: /Aprovar Documentação/i });
        await user.click(approveBtn);

        // A API de atualização não deve ser chamada
        expect(companyService.update).not.toHaveBeenCalled();
    });

    it('deve disparar o download do documento', async () => {
        const user = userEvent.setup();
        (companyService.getById as any).mockResolvedValueOnce(mockCompany);
        (documentService.getAll as any).mockResolvedValueOnce(mockDocuments);
        (documentService.downloadDocument as any).mockResolvedValueOnce(new Blob());

        renderWithRouter(<AdminCompanyDetails />);

        // Aguarda documento carregar
        await waitFor(() => expect(screen.getByText('Contrato Social')).toBeInTheDocument());

        // Pega todos os botões e encontra o que não é o de Voltar nem de Aprovar (é o botão sem texto, com ícone de download)
        const downloadBtn = screen.getAllByRole('button')[2];
        await user.click(downloadBtn);

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith('Baixando...');
            expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-1', 'contrato.pdf');
        });
    });
});