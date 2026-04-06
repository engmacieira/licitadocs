import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminInboxPage } from './index';
import api from '../../../services/api';

// Mocks
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
                            created_at: new Date().toISOString()
                        },
                    ]
                });
            }
            if (url.includes('/messages/admin/alerts')) {
                return Promise.resolve({
                    data: [
                        { id: 'alert1', content: 'Aviso 1', title: 'Título 1', created_at: new Date().toISOString() },
                    ]
                });
            }
            if (url.includes('unread-count')) {
                return Promise.resolve({ data: { unread_count: 0 } });
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

        // Verifica as abas do sidebar (conforme InboxSidebar.tsx)
        expect(await screen.findByText(/Tickets/i)).toBeInTheDocument();
        expect(screen.getByText(/Avisos Emitidos/i)).toBeInTheDocument();

        // Verifica se o ticket do mock aparece (findBy para o loading)
        expect(await screen.findByText(/Ticket 1/i)).toBeInTheDocument();

        // Verifica a área de conversa (padrão quando nada selecionado)
        expect(screen.getByText(/Selecione um ticket na lista ao lado/i)).toBeInTheDocument();
    });
});
