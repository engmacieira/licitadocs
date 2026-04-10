import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { OnboardingWizard } from './OnboardingWizard';
import { MemoryRouter } from 'react-router-dom';

// Mock do useNavigate


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

describe('OnboardingWizard', () => {
    const mockCompany = {
        razao_social: 'Empresa Teste LTDA'
    };

    const mockLoadData = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (companyStatus: any) => render(
        <MemoryRouter>
            <OnboardingWizard
                currentCompany={mockCompany}
                companyStatus={companyStatus}
                loadData={mockLoadData}
            />
        </MemoryRouter>
    );

    it('deve renderizar o título com o nome da empresa', () => {
        renderComponent({
            terms: false,
            data: false,
            payment: false,
            contract: false,
            approval: false,
            pendencies: null
        });

        expect(screen.getByText(/Finalize a configuração da/i)).toBeInTheDocument();
        expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
    });

    it('deve exibir alerta de pendências quando houver', () => {
        renderComponent({
            terms: true,
            data: true,
            payment: false,
            contract: false,
            approval: false,
            pendencies: 'Documento X está ilegível.'
        });

        expect(screen.getByText('Atenção! Pendências na sua conta:')).toBeInTheDocument();
        expect(screen.getByText('Documento X está ilegível.')).toBeInTheDocument();
    });

    it('deve mostrar status Concluído para passos finalizados', () => {
        renderComponent({
            terms: true,
            payment: false,
            data: false,
            contract: false,
            approval: false,
            pendencies: null
        });

        // O passo 1 deve estar Concluído
        expect(screen.getByText('1. Aceite dos Termos')).toBeInTheDocument();
        expect(screen.getAllByText('Concluído').length).toBe(1);
        expect(screen.queryByText('Ler e Aceitar')).not.toBeInTheDocument();
    });

    it('deve habilitar e navegar para o próximo passo pendente (Pagamento após Termos)', () => {
        renderComponent({
            terms: true,
            payment: false,
            data: false,
            contract: false,
            approval: false,
            pendencies: null
        });

        // Passo 2 (Pagamento) deve estar habilitado
        const paymentButton = screen.getByText('Realizar Pagamento');
        expect(paymentButton).not.toBeDisabled();
        
        fireEvent.click(paymentButton);
        expect(mockNavigate).toHaveBeenCalledWith('/payment');
    });

    it('deve manter desabilitado passos que dependem do anterior (Dados depende de Pagamento)', () => {
        renderComponent({
            terms: true,
            payment: false, // Pagamento não realizado
            data: false,
            contract: false,
            approval: false,
            pendencies: null
        });

        // Passo 3 (Dados) deve estar desabilitado porque Pagamento não foi concluído
        const completeDataButton = screen.getByText('Completar Dados');
        expect(completeDataButton).toBeDisabled();
    });

    it('deve navegar para cada passo corretamente ao clicar nos botões', () => {
        const { rerender } = render(
            <MemoryRouter>
                <OnboardingWizard
                    currentCompany={mockCompany}
                    companyStatus={{ terms: false, data: false, payment: false, contract: false, approval: false, pendencies: null }}
                    loadData={mockLoadData}
                />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Ler e Aceitar'));
        expect(mockNavigate).toHaveBeenCalledWith('/contract-sign');

        rerender(
            <MemoryRouter>
                <OnboardingWizard
                    currentCompany={mockCompany}
                    companyStatus={{ terms: true, data: true, payment: false, contract: false, approval: false, pendencies: null }}
                    loadData={mockLoadData}
                />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Realizar Pagamento'));
        expect(mockNavigate).toHaveBeenCalledWith('/payment');

        rerender(
            <MemoryRouter>
                <OnboardingWizard
                    currentCompany={mockCompany}
                    companyStatus={{ terms: true, data: true, payment: true, contract: false, approval: false, pendencies: null }}
                    loadData={mockLoadData}
                />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Assinar Documentos'));
        expect(mockNavigate).toHaveBeenCalledWith('/signature');
    });

    it('deve mostrar "Em Análise" no passo 5 se não estiver aprovado', () => {
        renderComponent({
            terms: true,
            data: true,
            payment: true,
            contract: true,
            approval: false,
            pendencies: null
        });

        expect(screen.getByText('5. Validação da Equipe')).toBeInTheDocument();
        expect(screen.getByText('Em Análise')).toBeInTheDocument();
    });

    it('deve chamar loadData ao clicar em Atualizar Status', () => {
        renderComponent({
            terms: true,
            data: true,
            payment: true,
            contract: true,
            approval: false,
            pendencies: null
        });

        fireEvent.click(screen.getByText('Atualizar Status'));
        expect(mockLoadData).toHaveBeenCalled();
    });
});
