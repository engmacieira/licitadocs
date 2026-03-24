import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminEmissionRulesPage } from './index';
import { emissionRuleService } from '../../../services/emissionRuleService';
import { documentService } from '../../../services/documentService';

// Mocks
vi.mock('../../../services/emissionRuleService', () => ({
    emissionRuleService: {
        getAll: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
    },
}));

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Admin Teste', role: 'admin' },
        loading: false,
        isAuthenticated: true,
    })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AdminEmissionRulesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (emissionRuleService.getAll as any).mockResolvedValue([
            { id: 'rule1', document_type_id: 'type1', city: 'São Paulo', state: 'SP' },
        ]);
        (documentService.getTypes as any).mockResolvedValue([
            { id: 'cat1', name: 'Fiscal', types: [{ id: 'type1', name: 'Certidão Negativa', scope: 'MUNICIPAL' }] },
        ]);
    });

    it('deve renderizar o título de diretórios de emissão e as abas de escopo', async () => {
        render(
            <MemoryRouter>
                <AdminEmissionRulesPage />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText(/Diretórios de Emissão/i)).toBeInTheDocument();
        
        // Verifica as abas de escopo
        expect(screen.getByText(/Municipal/i)).toBeInTheDocument();
        expect(screen.getByText(/Estadual/i)).toBeInTheDocument();
        expect(screen.getByText(/Nacional/i)).toBeInTheDocument();
        
        // Verifica o botão de Nova Regra
        expect(screen.getByText(/Nova Regra/i)).toBeInTheDocument();
        
        // Verifica se a regra do mock aparece (usando findBy para o loading)
        expect(await screen.findByText(/São Paulo/i)).toBeInTheDocument();
    });
});
