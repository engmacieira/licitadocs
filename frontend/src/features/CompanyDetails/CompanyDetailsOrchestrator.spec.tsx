import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CompanyDetailsOrchestrator } from './CompanyDetailsOrchestrator';
import { companyService } from '../../services/companyService';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

// Mocks
vi.mock('../../services/companyService', () => ({
    companyService: {
        getById: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock('../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        downloadDocument: vi.fn()
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '123' })
    };
});

const mockCompany = {
    id: '123',
    razao_social: 'Empresa Teste LTDA',
    cnpj: '12.345.678/0001-99',
    email_corporativo: 'contato@empresa.com',
    is_admin_verified: false,
    is_contract_signed: false,
    nome_fantasia: 'Teste Fantasia',
    responsavel_nome: 'João da Silva',
    telefone: '(11) 99999-8888',
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    is_active: true,
    created_at: new Date().toISOString()
};

const mockDocs = [
    {
        id: 'doc-1',
        filename: 'contrato.pdf',
        title: 'Contrato',
        status: 'valid',
        created_at: '2023-10-27T10:00:00Z',
        is_structured: true
    }
];

describe('CompanyDetailsOrchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);
    });

    it('deve exibir skeleton durante o carregamento inicial', async () => {
        // Mock que demora para carregar
        let resolveCompany: any;
        const companyPromise = new Promise((resolve) => { resolveCompany = resolve; });
        vi.mocked(companyService.getById).mockReturnValue(companyPromise as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        // Verifica se o container do skeleton está presente (pela classe p-8 e Skeleton)
        // O Skeleton é renderizado quando loading é true
        expect(document.querySelector('.animate-pulse') || document.querySelector('.p-8')).toBeInTheDocument();

        resolveCompany(mockCompany);
        await waitFor(() => expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument());
    });

    it('deve renderizar os dados corretamente após carregar', async () => {
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs as any);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
            expect(screen.getByText('João da Silva')).toBeInTheDocument();
            expect(screen.getByText('Contrato')).toBeInTheDocument();
        });
    });

    it('deve exibir mensagem de erro se a empresa não for encontrada', async () => {
        vi.mocked(companyService.getById).mockResolvedValue(null as any);
        vi.mocked(documentService.getAll).mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Empresa não encontrada.')).toBeInTheDocument();
        });
    });

    it('deve lidar com erro na API chamando o toast', async () => {
        vi.mocked(companyService.getById).mockRejectedValue(new Error('API Error'));
        
        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar detalhes da empresa.');
        });
    });

    it('deve executar o fluxo de aprovação com sucesso', async () => {
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs as any);
        vi.mocked(companyService.update).mockResolvedValue({ ...mockCompany, is_admin_verified: true } as any);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument());

        const approveButton = screen.getByRole('button', { name: /aprovar documentação/i });
        fireEvent.click(approveButton);

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(companyService.update).toHaveBeenCalledWith('123', { is_admin_verified: true });
            expect(toast.success).toHaveBeenCalledWith('Empresa aprovada com sucesso!');
            expect(screen.getByText('Empresa Verificada')).toBeInTheDocument();
        });
    });

    it('deve cancelar aprovação se o usuário não confirmar', async () => {
        window.confirm = vi.fn(() => false);
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs as any);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByRole('button', { name: /aprovar documentação/i })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /aprovar documentação/i }));

        expect(companyService.update).not.toHaveBeenCalled();
    });

    it('deve executar o download de um documento', async () => {
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs as any);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Contrato')).toBeInTheDocument());

        // O botão de download não tem texto, apenas o ícone.
        // Já o botão de 'Voltar' e 'Aprovar' têm texto.
        const allButtons = screen.getAllByRole('button');
        const downloadButton = allButtons.find(btn => !btn.textContent);
        
        if (!downloadButton) throw new Error('Download button not found');
        fireEvent.click(downloadButton);

        expect(toast.info).toHaveBeenCalledWith('Baixando...');
        expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocs[0].id, mockDocs[0].filename);
    });

    it('deve navegar de volta para a lista ao clicar no botão Voltar', async () => {
        vi.mocked(companyService.getById).mockResolvedValue(mockCompany as any);
        vi.mocked(documentService.getAll).mockResolvedValue(mockDocs as any);

        render(
            <MemoryRouter>
                <CompanyDetailsOrchestrator />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText(/Voltar para a Lista/i)).toBeInTheDocument());

        fireEvent.click(screen.getByText(/Voltar para a Lista/i));

        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies');
    });
});
