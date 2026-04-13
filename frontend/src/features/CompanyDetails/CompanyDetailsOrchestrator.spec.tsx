import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
        getAll: vi.fn()
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }
}));

describe('CompanyDetailsOrchestrator', () => {
    const mockCompany = {
        id: 'comp-123',
        razao_social: 'Empresa Alpha',
        cnpj: '11.111.111/0001-11',
        is_admin_verified: false,
        pending_docs_notes: 'Nota antiga'
    };

    const mockDocuments = [
        { id: 'doc-1', filename: 'contrato.pdf', title: 'Contrato Social' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getById as any).mockResolvedValue(mockCompany);
        (documentService.getAll as any).mockResolvedValue(mockDocuments);
        (companyService.update as any).mockResolvedValue({ ...mockCompany, is_admin_verified: true });
    });

    // Função utilitária para renderizar o componente dentro de um Router providenciando o :id na URL
    const renderComponent = () => render(
        <MemoryRouter initialEntries={['/admin/companies/comp-123']}>
            <Routes>
                <Route path="/admin/companies/:id" element={<CompanyDetailsOrchestrator />} />
            </Routes>
        </MemoryRouter>
    );

    it('deve carregar e exibir os dados da empresa e documentos', async () => {
        renderComponent();

        // Verifica se chamou as APIs corretamente com o ID da URL
        await waitFor(() => {
            expect(companyService.getById).toHaveBeenCalledWith('comp-123');
            expect(documentService.getAll).toHaveBeenCalledWith('comp-123');
        });

        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
        expect(screen.getByText('contrato.pdf')).toBeInTheDocument();
    });

    it('deve carregar as notas pendentes na caixa de moderação', async () => {
        renderComponent();

        const textarea = await screen.findByPlaceholderText(/Descreva aqui as pendências para o cliente/i);
        expect(textarea).toHaveValue('Nota antiga');
    });

    it('deve adicionar um alerta rápido ao clicar nos botões de moderação (US-2905)', async () => {
        const user = userEvent.setup();
        renderComponent();

        const textarea = await screen.findByPlaceholderText(/Descreva aqui as pendências para o cliente/i);
        await waitFor(() => expect(textarea).toHaveValue('Nota antiga'));

        // Clica no botão de alerta rápido
        const alertBtn = screen.getByRole('button', { name: '+ RG Ilegível' });
        await user.click(alertBtn);

        // Verifica se concatenou corretamente
        expect(textarea).toHaveValue('Nota antiga\n- RG Ilegível');
    });

    it('deve aprovar a documentação da empresa com sucesso', async () => {
        const user = userEvent.setup();
        renderComponent();

        const approveBtn = await screen.findByRole('button', { name: /Aprovar Documentação/i });
        await user.click(approveBtn);

        await waitFor(() => {
            expect(companyService.update).toHaveBeenCalledWith('comp-123', { is_admin_verified: true });
            expect(toast.success).toHaveBeenCalledWith('Empresa verificada com sucesso!');
        });
    });

    it('deve salvar a moderação e disparar notificação (US-2907)', async () => {
        const user = userEvent.setup();
        renderComponent();

        const textarea = await screen.findByPlaceholderText(/Descreva aqui as pendências para o cliente/i);
        await waitFor(() => expect(textarea).toHaveValue('Nota antiga'));

        // Adiciona um novo alerta
        const alertBtn = screen.getByRole('button', { name: '+ CNPJ Desatualizado' });
        await user.click(alertBtn);

        // Clica em Guardar e Avisar
        const saveNotifyBtn = screen.getByRole('button', { name: /Guardar e Avisar Cliente/i });
        await user.click(saveNotifyBtn);

        await waitFor(() => {
            // Verifica se mandou o payload correto para a API
            expect(companyService.update).toHaveBeenCalledWith('comp-123', {
                pending_docs_notes: 'Nota antiga\n- CNPJ Desatualizado'
            });
            // Verifica se o toast correto de automação apareceu
            expect(toast.success).toHaveBeenCalledWith('Pendências guardadas e cliente notificado!');
        });
    });

    it('deve exibir mensagem de erro se a empresa não for encontrada', async () => {
        (companyService.getById as any).mockResolvedValue(null);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Empresa não encontrada.')).toBeInTheDocument();
        });
    });
});