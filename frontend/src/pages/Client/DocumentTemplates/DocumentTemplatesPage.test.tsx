import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentTemplatesPage } from './index';

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
        currentCompany: { 
            id: '1', 
            razao_social: 'Empresa Teste Ltda',
            cnpj: '12.345.678/0001-90',
            logradouro: 'Rua Teste',
            numero: '123',
            cidade: 'São Paulo',
            estado: 'SP'
        },
        userProfile: { nome: 'Usuário Teste', cpf: '123.456.789-00' }
    })
}));

describe('DocumentTemplatesPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título e as seções de modelos de documentos', () => {
        render(<DocumentTemplatesPage />);

        // Verifica o título principal
        expect(screen.getByText('Modelos de Documentos')).toBeInTheDocument();
        expect(screen.getByText(/Gere declarações e atestados padrão/i)).toBeInTheDocument();

        // Verifica se os dados da empresa estão sendo injetados no painel de contexto
        expect(screen.getAllByText('Empresa Teste Ltda').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/CNPJ: 12.345.678\/0001-90/i).length).toBeGreaterThan(0);

        // Verifica se as seções de Declarações e Atestados estão presentes
        expect(screen.getAllByText(/Declarações Unificadas/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Atestado de Capacidade Técnica/i).length).toBeGreaterThan(0);
    });
});
