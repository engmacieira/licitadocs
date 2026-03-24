import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage as CatalogSettingsPage } from './index';
import { documentService } from '../../../services/documentService';

// Mocks
vi.mock('../../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
        deleteCategory: vi.fn(),
        deleteType: vi.fn(),
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

describe('CatalogSettingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (documentService.getTypes as any).mockResolvedValue([
            { 
                id: 'cat1', 
                name: 'Categoria Fiscal', 
                slug: 'fiscal', 
                order: 1, 
                types: [
                    { id: 'type1', name: 'CND Municipal', scope: 'MUNICIPAL', validity_days_default: 30 }
                ] 
            },
        ]);
    });

    it('deve renderizar o título do catálogo de documentos e as categorias', async () => {
        render(
            <MemoryRouter>
                <CatalogSettingsPage />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText(/Catálogo de Documentos/i)).toBeInTheDocument();
        
        // Verifica o botão de Nova Categoria
        expect(screen.getByText(/Nova Categoria/i)).toBeInTheDocument();
        
        // Verifica se a categoria e o tipo aparecem (findBy para o loading)
        expect(await screen.findByText('Categoria Fiscal')).toBeInTheDocument();
        expect(screen.getByText('CND Municipal')).toBeInTheDocument();
    });
});
