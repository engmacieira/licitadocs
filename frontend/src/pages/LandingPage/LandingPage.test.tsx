import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingPage } from './index';

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

describe('LandingPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar os elementos principais do layout corretamente', () => {
        render(<LandingPage />);

        // Verifica o logo/nome da plataforma
        expect(screen.getByText('LicitaDocs')).toBeInTheDocument();

        // Verifica o título principal (Hero)
        expect(screen.getByText(/Suas certidões sempre em dia/i)).toBeInTheDocument();

        // Verifica os containers/títulos de features
        expect(screen.getByText('Mapeamento Descomplicado')).toBeInTheDocument();
        expect(screen.getByText('Gestão Especializada')).toBeInTheDocument();
        expect(screen.getByText('Blindagem de Pagamentos')).toBeInTheDocument();

        // Verifica botões de call to action
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Assinar Agora/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Como Funciona\?/i })).toBeInTheDocument();
    });

    it('deve navegar para a página de login ao clicar no botão Entrar/Login', async () => {
        const user = userEvent.setup();
        render(<LandingPage />);

        const loginButton = screen.getByRole('button', { name: /Login/i });
        await user.click(loginButton);

        expect(navigate).toHaveBeenCalledWith('/login');
    });

    it('deve navegar para a página de registro ao clicar no botão Quero Contratar', async () => {
        const user = userEvent.setup();
        render(<LandingPage />);

        const registerButton = screen.getByRole('button', { name: /Assinar Agora/i });
        await user.click(registerButton);

        expect(navigate).toHaveBeenCalledWith('/register');
    });

    it('deve navegar para a página de demonstração ao clicar no botão Como Funciona?', async () => {
        const user = userEvent.setup();
        render(<LandingPage />);

        const demoButton = screen.getByRole('button', { name: /Como Funciona\?/i });
        await user.click(demoButton);

        expect(navigate).toHaveBeenCalledWith('/demonstracao');
    });
});
