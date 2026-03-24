import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminUploadPage } from './index';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';

// Mocks
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
        update: vi.fn(),
    },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
        deleteDocument: vi.fn(),
        updateDocument: vi.fn(),
        downloadDocument: vi.fn(),
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

describe('AdminUploadPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getAll as any).mockResolvedValue([
            { id: 'c1', razao_social: 'Empresa Alpha', cnpj: '11.111.111/0001-11' },
            { id: 'c2', razao_social: 'Empresa Beta', cnpj: '22.222.222/0001-22' },
        ]);
        (documentService.getAll as any).mockResolvedValue([]);
    });

    it('deve renderizar o título da central de documentos e o seletor de empresa', async () => {
        render(
            <MemoryRouter>
                <AdminUploadPage />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText(/Central de Documentos/i)).toBeInTheDocument();
        
        // Verifica se o seletor de empresa aparece
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Selecione um cliente...', { selector: 'option' })).toBeInTheDocument();
        
        // Verifica se as empresas do mock aparecem nas opções do select (usando findBy para o loading)
        expect(await screen.findByText(/Empresa Alpha/i)).toBeInTheDocument();
        expect(await screen.findByText(/Empresa Beta/i)).toBeInTheDocument();
        
        // Verifica o estado inicial vazio do cofre
        expect(screen.getByText(/Nenhuma empresa selecionada/i)).toBeInTheDocument();
    });
});
