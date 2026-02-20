import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute'; // Ajuste se estiver noutra sub-pasta
import { useAuth } from '../contexts/AuthContext';

// ==========================================
// 🎭 MOCKING DO CONTEXTO DE AUTENTICAÇÃO
// ==========================================
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir o loader enquanto estiver verificando a sessão (loading: true)', () => {
        // Simulamos o estado inicial onde o AuthContext ainda está a ler o token
        (useAuth as any).mockReturnValue({ loading: true, isAuthenticated: false, user: null });

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Conteúdo Protegido</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Verificando credenciais...')).toBeInTheDocument();
        expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    });

    it('deve redirecionar para o login (/) se não estiver autenticado', () => {
        (useAuth as any).mockReturnValue({ loading: false, isAuthenticated: false, user: null });

        // Criamos um mini-site com 2 rotas para ver se o <Navigate> funciona
        render(
            <MemoryRouter initialEntries={['/area-secreta']}>
                <Routes>
                    <Route path="/" element={<div data-testid="login-page">Página de Login Fake</div>} />
                    <Route path="/area-secreta" element={
                        <ProtectedRoute>
                            <div>Conteúdo Secreto</div>
                        </ProtectedRoute>
                    } />
                </Routes>
            </MemoryRouter>
        );

        // O redirecionamento deve acontecer imediatamente, renderizando a rota '/'
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByText('Conteúdo Secreto')).not.toBeInTheDocument();
    });

    it('deve exibir "Acesso Restrito" se o usuário não tiver a role (permissão) necessária', () => {
        // Simulamos um Cliente comum logado
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'client' }
        });

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['admin']}>
                    <div>Painel de Admin</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // Verifica se a tela de bloqueio visual bloqueou a passagem
        expect(screen.getByRole('heading', { name: 'Acesso Restrito' })).toBeInTheDocument();
        // Verifica se o texto mostra a role 'client'
        expect(screen.getByText('client')).toBeInTheDocument();
        // O conteúdo secreto não pode estar na tela
        expect(screen.queryByText('Painel de Admin')).not.toBeInTheDocument();
    });

    it('deve renderizar o conteúdo (children) se o usuário tiver acesso permitido', () => {
        // Simulamos o Administrador logado
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { role: 'admin' }
        });

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['admin']}>
                    <div>Painel de Admin</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // O conteúdo agora deve estar perfeitamente visível!
        expect(screen.getByText('Painel de Admin')).toBeInTheDocument();
        expect(screen.queryByText('Acesso Restrito')).not.toBeInTheDocument();
    });
});