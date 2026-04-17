import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutPage } from './index';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock do react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
const navigate = mockNavigate;

const renderWithLayout = (component: React.ReactNode) => {
    return render(
        <MemoryRouter initialEntries={['/sobre']}>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/sobre" element={component} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
};

describe('AboutPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar os elementos institucionais principais', () => {
        renderWithLayout(<AboutPage />);

        // Verifica o título principal
        expect(screen.getByText(/10 anos julgando licitações./i)).toBeInTheDocument();
        expect(screen.getByText(/Agora, trabalhando a seu favor./i)).toBeInTheDocument();

        // Verifica seções de DNA/Valores
        expect(screen.getByText('Simplicidade e Organização')).toBeInTheDocument();
        expect(screen.getByText('Ética e Transparência')).toBeInTheDocument();
        expect(screen.getByText('Parceria Duradoura')).toBeInTheDocument();

        // Verifica a visão e objetivos
        expect(screen.getByText(/Visão e Objetivos/i)).toBeInTheDocument();
    });

    it('deve navegar de volta para a home ao clicar no botão Voltar', async () => {
        const user = userEvent.setup();
        renderWithLayout(<AboutPage />);

        const backButton = screen.getByLabelText(/Voltar/i);
        await user.click(backButton);

        // No PublicLayout, navigate(-1) é chamado. Com MemoryRouter e initialEntries, -1 volta para o estado anterior.
        // Como mockamos o navigate, verificamos se foi chamado com -1.
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it('deve navegar para login ao clicar no botão Entrar no Header', async () => {
        const user = userEvent.setup();
        renderWithLayout(<AboutPage />);

        const loginButton = screen.getByRole('button', { name: /Entrar/i });
        await user.click(loginButton);

        expect(navigate).toHaveBeenCalledWith('/login');
    });

    it('deve navegar para registro ao clicar no botão Criar Conta Agora', async () => {
        const user = userEvent.setup();
        renderWithLayout(<AboutPage />);

        const registerButton = screen.getByRole('button', { name: /Criar Conta Agora/i });
        await user.click(registerButton);

        expect(navigate).toHaveBeenCalledWith('/register');
    });

    it('deve navegar para demonstração ao clicar no botão Entender o Processo', async () => {
        const user = userEvent.setup();
        renderWithLayout(<AboutPage />);

        const demoButton = screen.getByRole('button', { name: /Entender o Processo/i });
        await user.click(demoButton);

        expect(navigate).toHaveBeenCalledWith('/demonstracao');
    });
});
