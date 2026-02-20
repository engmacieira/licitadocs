import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ContractSignPage } from './index';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';

// ==========================================
// 🎭 MOCKS
// ==========================================
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
    default: {
        patch: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { legalName: 'Empresa Teste', responsibleName: 'Carlos Responsavel' } }),
    };
});

describe('ContractSignPage Integration', () => {
    const mockCompany = { id: 'comp-123', razao_social: 'Empresa Alpha' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ currentCompany: mockCompany });
    });

    it('deve renderizar os termos de uso por padrão e permitir trocar para procuração', async () => {
        render(
            <MemoryRouter>
                <ContractSignPage />
            </MemoryRouter>
        );

        // Verifica aba inicial
        expect(screen.getByText('CONTRATO DE LICENÇA DE USO DE SOFTWARE')).toBeInTheDocument();

        // Troca para Procuração
        const proxyTab = screen.getByText('Procuração Digital');
        fireEvent.click(proxyTab);

        expect(screen.getByText('PROCURAÇÃO AD JUDICIA ET EXTRA')).toBeInTheDocument();
    });

    it('deve manter o botão de assinatura desativado até aceitar ambos os termos', async () => {
        render(
            <MemoryRouter>
                <ContractSignPage />
            </MemoryRouter>
        );

        const signButton = screen.getByRole('button', { name: /Assinar Documentos/i });
        expect(signButton).toBeDisabled();

        // Aceita Termos
        const termsCheckbox = screen.getByLabelText(/Li e concordo com os Termos de Uso/i);
        await userEvent.click(termsCheckbox);
        expect(signButton).toBeDisabled(); // Ainda falta a procuração

        // Troca aba e aceita Procuração
        fireEvent.click(screen.getByText('Procuração Digital'));
        const proxyCheckbox = screen.getByLabelText(/Assino digitalmente como responsável legal/i);
        await userEvent.click(proxyCheckbox);

        expect(signButton).toBeEnabled();
    });

    it('deve realizar o processo de assinatura com sucesso e navegar para pagamento', async () => {
        const user = userEvent.setup();
        (api.patch as any).mockResolvedValueOnce({});

        render(
            <MemoryRouter>
                <ContractSignPage />
            </MemoryRouter>
        );

        // Aceita Termos
        await user.click(screen.getByLabelText(/Li e concordo/i));

        // Aceita Procuração
        fireEvent.click(screen.getByText('Procuração Digital'));
        await user.click(screen.getByLabelText(/Assino digitalmente/i));

        // Clica em Assinar
        const signButton = screen.getByRole('button', { name: /Assinar Documentos/i });
        await user.click(signButton);

        // Verifica se chamou a API correta
        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/companies/comp-123/onboarding-step?step=contract');
            expect(toast.success).toHaveBeenCalledWith("Documentos assinados com sucesso!", expect.any(Object));
            expect(mockNavigate).toHaveBeenCalledWith('/payment');
        }, { timeout: 5000 }); // Timeout maior por causa do loop de simulação visual
    });

    it('deve exibir erro se a sessão da empresa não for encontrada', async () => {
        (useAuth as any).mockReturnValue({ currentCompany: null }); // Simula falha de contexto

        render(
            <MemoryRouter>
                <ContractSignPage />
            </MemoryRouter>
        );

        const termsCheckbox = screen.getByLabelText(/Li e concordo/i);
        await userEvent.click(termsCheckbox);

        // Simula aceitar a outra parte
        fireEvent.click(screen.getByText('Procuração Digital'));
        await userEvent.click(screen.getByLabelText(/Assino digitalmente/i));

        const signButton = screen.getByRole('button', { name: /Assinar Documentos/i });
        await userEvent.click(signButton);

        expect(toast.error).toHaveBeenCalledWith("Sessão não identificada", expect.any(Object));
    });
});