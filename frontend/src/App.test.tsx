import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// ==========================================
// 🎭 MOCKS DE CONTEXTOS E PROVIDERS
// ==========================================
vi.mock('./contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="auth-provider">{children}</div>
    ),
}));

vi.mock('sonner', () => ({
    Toaster: () => <div data-testid="toaster" />,
}));

// ==========================================
// 🎭 MOCKS DOS GUARDS E LAYOUT
// ==========================================
vi.mock('./components/ProtectedRoute', () => ({
    ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="protected-route">{children}</div>
    ),
}));

vi.mock('./components/layout/MainLayout', () => ({
    MainLayout: () => {
        // Importamos o Outlet do react-router-dom dinamicamente para o Mock
        // O Outlet é onde as rotas filhas (Dashboard, etc) vão ser injetadas
        const Router = require('react-router-dom');
        return (
            <div data-testid="main-layout">
                <Router.Outlet />
            </div>
        );
    }
}));

// ==========================================
// 🎭 MOCKS DAS PÁGINAS (Substituímos por caixas vazias)
// ==========================================
// Públicas
vi.mock('./pages/LandingPage', () => ({ LandingPage: () => <div data-testid="page-landing" /> }));
vi.mock('./pages/Login', () => ({ LoginPage: () => <div data-testid="page-login" /> }));
vi.mock('./pages/ContractSign', () => ({ ContractSignPage: () => <div data-testid="page-contract" /> }));

// Privadas (Cliente & Admin)
vi.mock('./pages/Client/Dashboard', () => ({ Dashboard: () => <div data-testid="page-dashboard" /> }));
vi.mock('./pages/Admin/Dashboard', () => ({ AdminDashboard: () => <div data-testid="page-admin-dashboard" /> }));
vi.mock('./pages/Admin/CompanyDetails', () => ({ AdminCompanyDetails: () => <div data-testid="page-admin-details" /> }));

describe('App Routing Integration', () => {
    beforeEach(() => {
        // Limpa o histórico do navegador virtual antes de cada teste
        window.history.pushState({}, '', '/');
    });

    it('deve renderizar a Landing Page na rota inicial "/"', () => {
        window.history.pushState({}, '', '/');
        render(<App />);

        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('page-landing')).toBeInTheDocument();
    });

    it('deve renderizar a LoginPage na rota "/login"', () => {
        window.history.pushState({}, '', '/login');
        render(<App />);

        expect(screen.getByTestId('page-login')).toBeInTheDocument();
        // Não deve ter layout protegido no login
        expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();
    });

    it('deve renderizar a página de Assinatura de Contrato na rota "/contract-sign"', () => {
        window.history.pushState({}, '', '/contract-sign');
        render(<App />);

        expect(screen.getByTestId('page-contract')).toBeInTheDocument();
    });

    it('deve proteger as rotas internas e renderizar o Dashboard na rota "/dashboard"', () => {
        window.history.pushState({}, '', '/dashboard');
        render(<App />);

        // Verifica se passou pelas barreiras de segurança
        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();

        // Verifica se chegou na página certa
        expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
    });

    it('deve renderizar a página de Detalhes da Empresa com parâmetros na rota "/admin/companies/:id"', () => {
        window.history.pushState({}, '', '/admin/companies/emp-999');
        render(<App />);

        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
        expect(screen.getByTestId('page-admin-details')).toBeInTheDocument();
    });

    it('deve redirecionar rotas não encontradas (404) para o "/dashboard"', () => {
        // Tentamos aceder a um URL que não existe
        window.history.pushState({}, '', '/rota-maluca-que-nao-existe');
        render(<App />);

        // O `<Route path="*" element={<Navigate to="/dashboard" replace />} />` entra em ação
        // Como ele redireciona para o Dashboard, o mock do Dashboard deve aparecer na tela
        expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
    });
});