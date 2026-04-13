import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminInboxPage } from './index';
import api from '../../../services/api';

// Mocks dos Serviços
vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
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

// Mock do Autocomplete de Empresa [US-2903]
vi.mock('../../../features/DocumentVault/components/CompanyAutocomplete', () => ({
    CompanyAutocomplete: () => <div data-testid="company-autocomplete-mock" />
}));

describe('AdminInboxPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/messages/admin/all')) {
                return Promise.resolve({
                    data: [
                        {
                            id: 'msg1',
                            content: 'Ticket 1',
                            subject: 'Suporte Técnico',
                            company_id: 'c1',
                            company_name: 'Empresa Alpha',
                            parent_id: null,
                            is_parent: true, // CORREÇÃO US-2903: Flag necessária para o filtro
                            created_at: new Date().toISOString()
                        },
                    ]
                });
            }
            if (url.includes('/messages/admin/alerts')) {
                return Promise.resolve({
                    data: [
                        { id: 'alert1', content: 'Aviso 1', subject: 'Título 1', company_name: 'Empresa Alpha', created_at: new Date().toISOString() },
                    ]
                });
            }
            if (url.includes('unread-count')) {
                return Promise.resolve({ data: { unread_count: 0 } });
            }
            // Mock para a lista de empresas do filtro
            if (url.includes('/companies')) {
                return Promise.resolve({ data: [] });
            }
            return Promise.resolve({ data: [] });
        });
    });

    it('deve renderizar os tickets de suporte e permitir a navegação entre abas', async () => {
        render(
            <MemoryRouter>
                <AdminInboxPage />
            </MemoryRouter>
        );

        // Verifica as abas do sidebar (Texto atualizado na US-2903)
        expect(await screen.findByText(/Suporte/i)).toBeInTheDocument();
        expect(screen.getByText(/Avisos/i)).toBeInTheDocument();

        // Verifica se o ticket do mock aparece (findBy para aguardar o loading da API)
        expect(await screen.findByText(/Ticket 1/i)).toBeInTheDocument();

        // Verifica a área de conversa (estado vazio inicial)
        expect(screen.getByText(/Selecione um ticket na lista ao lado/i)).toBeInTheDocument();
    });
});