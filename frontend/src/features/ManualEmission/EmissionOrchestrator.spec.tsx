import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmissionOrchestrator } from './EmissionOrchestrator';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mocks de Serviços
import { emissionRuleService } from '../../services/emissionRuleService';
import { companyService } from '../../services/companyService';
import { emissionRequestService } from '../../services/emissionRequestService';
import { toast } from 'sonner';

vi.mock('../../services/emissionRuleService');
vi.mock('../../services/companyService');
vi.mock('../../services/emissionRequestService');
vi.mock('sonner');

// Mock do react-router-dom para controlar navigation e params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate,
        useParams: () => ({ ruleId: 'rule-123' }),
        useSearchParams: () => [new URLSearchParams()],
    };
});

const mockRule = {
    id: 'rule-123',
    city: 'São Paulo',
    state: 'SP',
    contact_email: 'prefeitura@sp.gov.br',
    contact_whatsapp: '11999999999'
};

const mockCompanies = [
    { id: 'comp-1', razao_social: 'Empresa Alpha', cnpj: '11.111.111/0001-11', cidade: 'São Paulo', estado: 'SP' },
    { id: 'comp-2', razao_social: 'Empresa Beta', cnpj: '22.222.222/0002-22', cidade: 'Rio de Janeiro', estado: 'RJ' },
];

const mockHistory = [
    {
        id: 'hist-1',
        date: new Date(),
        companyId: 'comp-1',
        companyName: 'Empresa Alpha',
        estimatedDate: '2024-03-30',
        status: 'pending'
    }
];

describe('EmissionOrchestrator Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (emissionRuleService.getById as any).mockResolvedValue(mockRule);
        (companyService.getAll as any).mockResolvedValue(mockCompanies);
        (emissionRequestService.getByRuleAndCompany as any).mockResolvedValue(mockHistory);
        (emissionRequestService.create as any).mockResolvedValue({
            id: 'new-hist',
            date: new Date(),
            companyId: 'comp-1',
            companyName: 'Empresa Alpha',
            estimatedDate: '',
            status: 'pending'
        });
    });

    it('deve carregar dados da regra e empresas ao montar', async () => {
        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/A carregar painel de emissão/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(emissionRuleService.getById).toHaveBeenCalledWith('rule-123');
            expect(companyService.getAll).toHaveBeenCalled();
        });

        expect(screen.getByText(/Central de Emissão Manual/i)).toBeInTheDocument();
        expect(screen.getByText(/São Paulo - SP/i)).toBeInTheDocument();
    });

    it('deve exibir erro e navegar de volta se falhar ao carregar dados', async () => {
        (emissionRuleService.getById as any).mockRejectedValue(new Error('API Error'));

        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erro ao carregar dados'));
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it('deve atualizar templates e carregar histórico ao selecionar uma empresa', async () => {
        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Central de Emissão Manual/i));

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'comp-1' } });

        await waitFor(() => {
            expect(emissionRequestService.getByRuleAndCompany).toHaveBeenCalledWith('rule-123', 'comp-1');
        });

        // Verifica se o corpo do e-mail foi atualizado com o nome da empresa
        // O corpo do e-mail está no EmailSection como um textarea
        // Vamos buscar pelo label "Corpo do E-mail" e pegar o próximo elemento
        const bodyLabel = screen.getByText(/Corpo do E-mail/i);
        const bodyTextarea = bodyLabel.nextElementSibling as HTMLTextAreaElement;
        expect(bodyTextarea.value).toContain('Empresa Alpha');
    });

    it('deve registar o envio de e-mail e atualizar o histórico local', async () => {
        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Central de Emissão Manual/i));

        // Seleciona empresa para habilitar botão
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        const sendButton = screen.getByRole('button', { name: /Enviar E-mail/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(emissionRequestService.create).toHaveBeenCalledWith('rule-123', 'comp-1');
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('E-mail registado'), expect.any(Object));
        });
    });

    it('deve atualizar a previsão de retorno no histórico', async () => {
        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Central de Emissão Manual/i));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comp-1' } });

        await waitFor(() => {
            expect(screen.getAllByText(/Empresa Alpha/i).length).toBeGreaterThan(0);
        });
        
        // Buscamos o input de data pelo valor inicial definido no mockHistory
        const dateInput = await screen.findByDisplayValue('2024-03-30');
        
        fireEvent.change(dateInput, { target: { value: '2024-03-31' } });

        await waitFor(() => {
            expect(emissionRequestService.update).toHaveBeenCalledWith('hist-1', { estimated_date: '2024-03-31' });
        });
    });

    it('deve fechar a janela ao clicar no botão de voltar/fechar', async () => {
        const spy = vi.spyOn(window, 'close').mockImplementation(() => {});

        render(
            <MemoryRouter initialEntries={['/emission/rule-123']}>
                <Routes>
                    <Route path="/emission/:ruleId" element={<EmissionOrchestrator />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Central de Emissão Manual/i));

        const closeButton = screen.getByTitle('Fechar aba');
        fireEvent.click(closeButton);

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
