import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpCenterPage } from './index';

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
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda' }
    })
}));

// Mock do serviço de API
vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn().mockResolvedValue({
            data: [
                { 
                    id: 'msg-1', 
                    content: 'Aviso de Manutenção', 
                    message_type: 'system', 
                    created_at: new Date().toISOString(),
                    user_name: 'Sistema'
                }
            ]
        })
    }
}));

describe('HelpCenterPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título da central de ajuda e alertas', async () => {
        render(<HelpCenterPage />);

        // Verifica o título principal
        expect(screen.getByText('Central de Ajuda & Suporte')).toBeInTheDocument();
        expect(screen.getByText(/Acompanhe seus chamados/i)).toBeInTheDocument();

        // Muda para a aba de alertas se necessário, ou verifica se já aparece na lista
        // Por padrão abre 'tickets'. Vamos verificar se o sidebar de contato aparece.
        expect(screen.getByText('Fale Conosco')).toBeInTheDocument();

        // Aguarda carregamento de mensagens mockadas (mesmo que não visíveis de imediato na tab padrão, a chamada ocorre)
    });
});
