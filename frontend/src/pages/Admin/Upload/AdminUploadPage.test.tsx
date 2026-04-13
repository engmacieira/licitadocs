import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminUploadPage } from './index';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';

// Mocks dos Serviços
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

// Mock do novo Autocomplete [US-2902] para permitir a simulação no teste de integração da página
vi.mock('../../../features/DocumentVault/components/CompanyAutocomplete', () => ({
    CompanyAutocomplete: ({ value, onChange, companies }: any) => (
        <select
            role="combobox"
            data-testid="company-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Buscar empresa ou CNPJ...</option>
            {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.razao_social}</option>
            ))}
        </select>
    )
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

        // Verifica se o seletor de empresa aparece (aguardando o carregamento assíncrono do mock)
        expect(await screen.findByRole('combobox')).toBeInTheDocument();

        // CORREÇÃO: Busca pelo novo placeholder definido na US-2902
        expect(screen.getByText('Buscar empresa ou CNPJ...', { selector: 'option' })).toBeInTheDocument();

        // Verifica se as empresas do mock aparecem nas opções do select
        expect(await screen.findByText(/Empresa Alpha/i)).toBeInTheDocument();
    });
});