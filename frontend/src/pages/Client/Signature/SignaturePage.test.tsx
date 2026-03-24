import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignaturePage } from './index';

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} })
}));

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda' },
        userProfile: { nome: 'Usuário Teste' }
    })
}));

describe('SignaturePage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título de assinatura digital e instruções', () => {
        render(<SignaturePage />);

        // Verifica o título principal
        expect(screen.getByText('Assinatura Digital')).toBeInTheDocument();
        expect(screen.getByText(/Baixe os documentos, assine gratuitamente/i)).toBeInTheDocument();

        // Verifica as áreas de visualização e upload
        expect(screen.getByText(/Como Assinar\?/i)).toBeInTheDocument();
        expect(screen.getByText(/Anexar Documentos Assinados/i)).toBeInTheDocument();
    });
});
