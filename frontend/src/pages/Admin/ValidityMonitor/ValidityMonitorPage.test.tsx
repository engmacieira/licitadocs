import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ValidityMonitorPage } from './index';
import { documentService } from '../../../services/documentService';

// Mocks
vi.mock('../../../services/documentService', () => ({
    documentService: {
        getExpiring: vi.fn(),
        getIrregular: vi.fn(),
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

describe('ValidityMonitorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (documentService.getExpiring as any).mockResolvedValue([
            { 
                id: 'doc1', 
                title: 'Certidão Estadual', 
                company_id: 'c1',
                company_name: 'Empresa X', 
                company_cnpj: '11.111.111/0001-11',
                expiration_date: new Date(Date.now() + 864000000).toISOString() 
            },
        ]);
        (documentService.getIrregular as any).mockResolvedValue([
            { 
                id: 'doc2', 
                title: 'CND Municipal', 
                company_id: 'c2',
                company_name: 'Empresa Y', 
                company_cnpj: '22.222.222/0001-22',
                status: 'invalid' 
            },
        ]);
    });

    it('deve renderizar o título do monitor de regularidade e as abas', async () => {
        render(
            <MemoryRouter>
                <ValidityMonitorPage />
            </MemoryRouter>
        );

        // Verifica o título principal
        expect(screen.getByText(/Monitor de Regularidade/i)).toBeInTheDocument();
        
        // Verifica as abas do monitor
        expect(screen.getByText(/Empresas com Pendências/i)).toBeInTheDocument();
        expect(screen.getByText(/Documentos a Vencer/i)).toBeInTheDocument();
        
        // Verifica se os documentos do mock aparecem (findBy para o loading)
        expect(await screen.findByText('Empresa Y')).toBeInTheDocument();
        expect(screen.getByText('CND Municipal')).toBeInTheDocument();
    });
});
