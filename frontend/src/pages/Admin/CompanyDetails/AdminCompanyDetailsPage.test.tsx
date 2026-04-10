import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminCompanyDetailsPage } from './index';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';

// Mocks
vi.mock('../../../services/companyService', () => ({
    companyService: {
        getById: vi.fn(),
        update: vi.fn(),
    },
}));

vi.mock('../../../services/documentService', () => ({
    documentService: {
        getAll: vi.fn(),
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

describe('AdminCompanyDetailsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (companyService.getById as any).mockResolvedValue({
            id: '123',
            razao_social: 'Empresa Detalhe Ltda',
            cnpj: '00.000.000/0001-00',
            is_admin_verified: false,
            logradouro: 'Rua Teste',
            numero: '123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            is_contract_signed: true,
        });
        (documentService.getAll as any).mockResolvedValue([
            { id: 'doc1', title: 'Contrato Social', filename: 'contrato.pdf', created_at: new Date().toISOString() },
        ]);
    });

    it('deve renderizar os detalhes da empresa e documentos', async () => {
        render(
            <MemoryRouter initialEntries={['/admin/companies/123']}>
                <Routes>
                    <Route path="/admin/companies/:id" element={<AdminCompanyDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Verifica se os dados da empresa aparecem (usando findBy para lidar com o loading)
        expect(await screen.findByText('Empresa Detalhe Ltda')).toBeInTheDocument();
        expect(screen.getByText(/00.000.000\/0001-00/i)).toBeInTheDocument();
        
        // Verifica se o documento aparece
        expect(screen.getByText('Contrato Social')).toBeInTheDocument();
        
        // Verifica o botão de Aprovar Documentação (Compliance)
        expect(screen.getByText(/Aprovar Documentação/i)).toBeInTheDocument();
        
        // Verifica o botão de Voltar
        expect(screen.getByText(/Voltar para a Lista/i)).toBeInTheDocument();
    });
});
