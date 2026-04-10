import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SignaturePage } from './index';

// Mock do sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        warning: vi.fn(),
    },
}));

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

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda' },
        userProfile: { nome: 'Usuário Teste' }
    })
}));

// Mock do API para evitar chamadas reais durante a sincronização
vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn().mockImplementation((url) => {
            if (url.includes('/companies/')) {
                return Promise.resolve({ data: { id: '1', razao_social: 'Empresa Teste Ltda' } });
            }
            if (url.includes('/users/me')) {
                return Promise.resolve({ data: { nome: 'Usuário Teste' } });
            }
            return Promise.reject(new Error('not found'));
        })
    }
}));

describe('SignaturePage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título de assinatura digital e instruções após sincronização', async () => {
        render(<SignaturePage />);

        // Inicialmente mostra o estado de sincronização
        expect(screen.getByText(/Sincronizando dados jurídicos/i)).toBeInTheDocument();

        // Aguarda a sincronização terminar
        await waitFor(() => {
            expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
        });

        // Verifica o título principal
        expect(screen.getByText('Assinatura Digital')).toBeInTheDocument();
        expect(screen.getByText(/Baixe os documentos, assine gratuitamente/i)).toBeInTheDocument();

        // Verifica as áreas de visualização e upload
        expect(screen.getByText(/Como Assinar\?/i)).toBeInTheDocument();
        expect(screen.getByText(/Anexar Documentos Assinados/i)).toBeInTheDocument();
    });
});
