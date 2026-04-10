import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ManualEmissionPage } from './index';
import { emissionRuleService } from '../../../services/emissionRuleService';
import { companyService } from '../../../services/companyService';
import { emissionRequestService } from '../../../services/emissionRequestService';

// Mocks
vi.mock('../../../services/emissionRuleService', () => ({
    emissionRuleService: {
        getById: vi.fn(),
    },
}));

vi.mock('../../../services/companyService', () => ({
    companyService: {
        getAll: vi.fn(),
    },
}));

vi.mock('../../../services/emissionRequestService', () => ({
    emissionRequestService: {
        getByRuleAndCompany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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

describe('ManualEmissionPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (emissionRuleService.getById as any).mockResolvedValue({
            id: 'rule123',
            city: 'Braúnas',
            state: 'MG',
            contact_whatsapp: '31999999999'
        });
        (companyService.getAll as any).mockResolvedValue([
            { 
                id: 'comp456', 
                razao_social: 'Empresa Teste MG', 
                cnpj: '00.000.000/0001-00',
                cidade: 'Braúnas',
                estado: 'MG'
            },
        ]);
        (emissionRequestService.getByRuleAndCompany as any).mockResolvedValue([]);
    });

    it('deve renderizar o título da central de emissão manual e as seções de e-mail e whatsapp', async () => {
        await act(async () => {
            render(
                <MemoryRouter initialEntries={['/admin/manual-emission/rule123?companyId=comp456']}>
                    <Routes>
                        <Route path="/admin/manual-emission/:ruleId" element={<ManualEmissionPage />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        // Verifica o título principal (findBy para o loading)
        expect(await screen.findByText(/Central de Emissão Manual/i)).toBeInTheDocument();
        
        // Verifica a cidade e estado (múltiplas ocorrências, usamos findAllByText)
        const cityElements = await screen.findAllByText(/Braúnas/i);
        expect(cityElements.length).toBeGreaterThan(0);
        
        // Verifica se a empresa selecionada aparece no seletor (usamos findAllByText para evitar erro de múltiplos elementos)
        const companyElements = await screen.findAllByText(/Empresa Teste MG/i);
        expect(companyElements.length).toBeGreaterThan(0);
        
        // Verifica as seções de E-mail e WhatsApp
        expect(screen.getByText(/Corpo do E-mail/i)).toBeInTheDocument();
        expect(screen.getByText(/Cobrança via WhatsApp/i)).toBeInTheDocument();
    });
});
