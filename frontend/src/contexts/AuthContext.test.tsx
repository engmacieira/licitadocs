import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { jwtDecode } from 'jwt-decode';

// ==========================================
// 🎭 MOCKING DE SERVIÇOS E BIBLIOTECAS
// ==========================================
vi.mock('../services/authService', () => ({
    authService: {
        signIn: vi.fn(),
    },
}));

vi.mock('../services/userService', () => ({
    userService: {
        getMyCompanies: vi.fn(),
    },
}));

vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(),
}));

// Wrapper necessário para o useAuth funcionar dentro do contexto
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear(); // Limpa a memória do navegador antes de cada teste!
    });

    it('deve inicializar deslogado se não houver token no localStorage', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        // O loading fica false após a verificação inicial
        expect(result.current.loading).toBe(false);
    });

    it('deve realizar login (signIn), decodificar o token e carregar empresas', async () => {
        // 1. Preparamos os mocks para o Caminho Feliz
        const mockToken = 'fake-jwt-token';
        const mockUser = { sub: 'teste@teste.com', role: 'admin', user_id: '123' };
        const mockCompanies = [{ id: 'comp-1', razao_social: 'Empresa Alpha' }];

        (authService.signIn as any).mockResolvedValueOnce({ access_token: mockToken });
        (jwtDecode as any).mockReturnValueOnce(mockUser);
        (userService.getMyCompanies as any).mockResolvedValueOnce(mockCompanies);

        const { result } = renderHook(() => useAuth(), { wrapper });

        // 2. Ação: Chamamos a função signIn de dentro do contexto
        await act(async () => {
            await result.current.signIn({ email: 'teste@teste.com', password: '123' });
        });

        // 3. Validações
        expect(authService.signIn).toHaveBeenCalledWith({ email: 'teste@teste.com', password: '123' });
        expect(localStorage.getItem('@LicitaDoc:token')).toBe(mockToken);

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);

        // Verifica se carregou as empresas e definiu a primeira como ativa
        expect(result.current.companies).toEqual(mockCompanies);
        expect(result.current.currentCompany).toEqual(mockCompanies[0]);
    });

    it('deve restaurar a sessão se a página for recarregada com um token válido', async () => {
        // 1. Simulamos um usuário que já tinha logado antes (F5 na página)
        localStorage.setItem('@LicitaDoc:token', 'token-antigo');
        const mockUser = { sub: 'velho@teste.com', role: 'client', exp: (Date.now() / 1000) + 3600 }; // Expira em 1 hora
        const mockCompanies = [{ id: 'comp-2', razao_social: 'Empresa Beta' }];

        (jwtDecode as any).mockReturnValueOnce(mockUser);
        (userService.getMyCompanies as any).mockResolvedValueOnce(mockCompanies);

        // 2. Renderizamos o contexto (Isso dispara o useEffect inicial)
        const { result } = renderHook(() => useAuth(), { wrapper });

        // 3. Esperamos as promessas do useEffect resolverem
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user?.sub).toBe('velho@teste.com');
            expect(result.current.companies).toEqual(mockCompanies);
        });
    });

    it('deve deslogar (signOut) o usuário se o token estiver expirado no carregamento inicial', () => {
        localStorage.setItem('@LicitaDoc:token', 'token-vencido');
        // Exp = tempo no passado
        const mockUser = { sub: 'vencido@teste.com', role: 'client', exp: (Date.now() / 1000) - 3600 };
        (jwtDecode as any).mockReturnValueOnce(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper });

        // O sistema deve perceber que venceu e limpar tudo
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
    });

    it('deve limpar os dados ao chamar a função signOut()', async () => {
        // Setup: Forçamos um estado logado
        localStorage.setItem('@LicitaDoc:token', 'meu-token');
        localStorage.setItem('@LicitaDoc:companyId', 'comp-1');

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Ação: O usuário clica em Sair
        act(() => {
            result.current.signOut();
        });

        // Validação: Tudo tem de voltar a zero
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.companies).toEqual([]);
        expect(result.current.currentCompany).toBeNull();

        expect(localStorage.getItem('@LicitaDoc:token')).toBeNull();
        expect(localStorage.getItem('@LicitaDoc:companyId')).toBeNull();
    });

    it('deve trocar a empresa ativa corretamente ao chamar switchCompany()', async () => {
        // Precisamos mockar as empresas primeiro para o loadUserContext
        const mockCompanies = [
            { id: 'comp-1', razao_social: 'Matriz' },
            { id: 'comp-2', razao_social: 'Filial' }
        ];
        (userService.getMyCompanies as any).mockResolvedValueOnce(mockCompanies);
        (jwtDecode as any).mockReturnValueOnce({ sub: 'user', exp: (Date.now() / 1000) + 3600 });
        localStorage.setItem('@LicitaDoc:token', 'token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Espera carregar o contexto inicial
        await waitFor(() => {
            expect(result.current.companies).toHaveLength(2);
            expect(result.current.currentCompany?.id).toBe('comp-1'); // Matriz por padrão
        });

        // Ação: Troca para a Filial
        act(() => {
            result.current.switchCompany('comp-2');
        });

        // Validação: O contexto e o LocalStorage mudaram
        expect(result.current.currentCompany?.id).toBe('comp-2');
        expect(result.current.currentCompany?.razao_social).toBe('Filial');
        expect(localStorage.getItem('@LicitaDoc:companyId')).toBe('comp-2');
    });
});