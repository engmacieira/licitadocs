import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DocumentsPage } from './index';

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} })
}));

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { role: 'client' },
        currentCompany: { id: '1', razao_social: 'Empresa Teste Ltda' }
    })
}));

// Mock do serviço de documentos
vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn().mockResolvedValue([
            { 
                id: '101', 
                title: 'Certidão Negativa Federal', 
                category_name: 'Fiscal', 
                is_client_upload: false,
                status: 'valid',
                created_at: new Date().toISOString(),
                expiration_date: new Date(Date.now() + 86400000).toISOString()
            }
        ])
    }
}));

describe('DocumentsPage Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o título do cofre e os documentos carregados', async () => {
        render(<DocumentsPage />);

        // Verifica o título do cofre
        expect(screen.getByText('Cofre Digital')).toBeInTheDocument();

        // Aguarda o carregamento dos documentos
        await waitFor(() => {
            expect(screen.getByText('Certidão Negativa Federal')).toBeInTheDocument();
        });

        // Verifica se a barra de pesquisa está presente
        expect(screen.getByPlaceholderText(/Buscar documentos.../i)).toBeInTheDocument();
    });
});
