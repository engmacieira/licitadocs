import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractSignPage } from './index';

// Mock do react-router-dom


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});
const navigate = mockNavigate;

// Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste' }
    })
}));

describe('ContractSignPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título e a área de termos de uso', () => {
        render(<ContractSignPage />);

        // Verifica o título principal
        expect(screen.getByText('Termos de Uso e Minutas')).toBeInTheDocument();
        expect(screen.getByText(/Por favor, leia o Termo de Aceite abaixo/i)).toBeInTheDocument();

        // Verifica o checklist de leitura
        expect(screen.getByText('Checklist de Leitura Obrigatória')).toBeInTheDocument();
        expect(screen.getByText(/2. Contrato Principal/i)).toBeInTheDocument();
        expect(screen.getByText(/3. Procuração Específica/i)).toBeInTheDocument();

        // Verifica o botão de ação (inicialmente desabilitado)
        const acceptButton = screen.getByRole('button', { name: /Aceitar e Continuar/i });
        expect(acceptButton).toBeDisabled();
    });

    it('deve navegar de volta para a home ao clicar no botão Voltar', async () => {
        const user = userEvent.setup();
        render(<ContractSignPage />);

        const backButton = screen.getByRole('button', { name: /Voltar/i });
        await user.click(backButton);

        expect(navigate).toHaveBeenCalledWith('/');
    });
});
