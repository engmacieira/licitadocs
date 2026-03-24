import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypeModal } from './TypeModal';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

// Mock do serviço e do toast
vi.mock('../../../services/documentService', () => ({
    documentService: {
        createType: vi.fn(),
        updateType: vi.fn(),
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('TypeModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        categoryId: 'cat-test-id',
        initialData: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar corretamente para novo documento', () => {
        render(<TypeModal {...defaultProps} />);
        
        expect(screen.getByText('Novo Documento')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: CND Federal')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: cnd_federal')).toBeInTheDocument();
        expect(screen.getByText(/Abrangência/)).toBeInTheDocument();
        expect(screen.getByText('Dias de Validade Padrão')).toBeInTheDocument();
        expect(screen.getByText('É Automatizável? (Buscar via Robô)')).toBeInTheDocument();
    });

    it('deve exibir campos de automação quando o checkbox for marcado', async () => {
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();
        
        // O checkbox está dentro da label, então getByLabelText deve funcionar se o seletor for exato
        const automationCheckbox = screen.getByLabelText('É Automatizável? (Buscar via Robô)');
        await user.click(automationCheckbox);

        expect(screen.getByPlaceholderText('Ex: TST_CRAWLER_V1')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: https://www.tst.jus.br/...')).toBeInTheDocument();
        expect(screen.getByText('Requer Quebra de Captcha')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: 0 0 * * * (Diário)')).toBeInTheDocument();
    });

    it('deve exibir erro de validação se campos obrigatórios estiverem vazios', async () => {
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();
        
        // Limpar campos que podem ter defaults (validity_days_default tem default 30)
        // Precisamos garantir que name está vazio
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            const errors = screen.getAllByText('Obrigatório');
            expect(errors.length).toBeGreaterThan(0);
        });
        
        expect(documentService.createType).not.toHaveBeenCalled();
    });

    it('deve chamar documentService.createType com sucesso', async () => {
        vi.mocked(documentService.createType).mockResolvedValue({ 
            id: 'new-type-id', 
            name: 'Certidão', 
            slug: 'certidao', 
            scope: 'NATIONAL', 
            validity_days_default: 30 
        } as any);
        
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'Certidão');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'certidao');
        
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(documentService.createType).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Certidão',
                slug: 'certidao',
                category_id: 'cat-test-id'
            }));
        });

        expect(toast.success).toHaveBeenCalledWith('Documento adicionado à categoria!');
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve chamar documentService.updateType com os dados de automação', async () => {
        const initialData = { 
            id: 'type-1', 
            name: 'Doc 1', 
            slug: 'doc-1', 
            scope: 'NATIONAL', 
            validity_days_default: 30,
            automation_config: { is_automatable: false, requires_captcha: false }
        } as any;
        
        vi.mocked(documentService.updateType).mockResolvedValue({ ...initialData, name: 'Doc Updated' });
        
        render(<TypeModal {...defaultProps} initialData={initialData} />);
        const user = userEvent.setup();

        // Ativa automação e preenche
        await user.click(screen.getByLabelText('É Automatizável? (Buscar via Robô)'));
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Ex: TST_CRAWLER_V1')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('Ex: TST_CRAWLER_V1'), 'STRATEGY_A');
        
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(documentService.updateType).toHaveBeenCalledWith('type-1', expect.objectContaining({
                automation_config: expect.objectContaining({
                    is_automatable: true,
                    strategy_name: 'STRATEGY_A'
                })
            }));
        });

        expect(toast.success).toHaveBeenCalledWith('Documento atualizado!');
    });

    it('deve exibir toast.error se a API falhar', async () => {
        vi.mocked(documentService.createType).mockRejectedValue({
            response: { data: { detail: 'Erro Servidor' } }
        });
        
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'Certidão');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'certidao');
        
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro Servidor');
        });
    });

    it('deve chamar onClose ao cancelar', async () => {
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: /Cancelar/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    /**
     * CENÁRIO DE SEGURANÇA: Prevenção de Spam / Comportamento de Bot
     * Simula múltiplos cliques rápidos no botão de salvar.
     */
    it('SPAM: should prevent multiple submissions when clicked rapidly', async () => {
        // Mock com delay para simular rede lenta e manter o estado isSaving=true
        vi.mocked(documentService.createType).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();

        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'Spam Test');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'spam-test');

        const saveButton = screen.getByRole('button', { name: /Salvar/i });

        // Dispara 20 cliques sem esperar o anterior terminar
        const clicks = Array.from({ length: 20 }).map(() => user.click(saveButton));
        await Promise.all(clicks);

        // Verifica se o serviço foi chamado apenas UMA vez
        expect(documentService.createType).toHaveBeenCalledTimes(1);
        // Verifica se o botão ficou desativado (loading state)
        expect(saveButton).toBeDisabled();
    });

    /**
     * CENÁRIO DE SEGURANÇA: Cross-Site Scripting (XSS)
     * Garante que scripts maliciosos não são executados e são tratados como texto.
     */
    it('XSS: should escape malicious script tags in input fields', async () => {
        render(<TypeModal {...defaultProps} />);
        const user = userEvent.setup();

        const xssPayload = "<script>alert('xss')</script>";
        const nameInput = screen.getByPlaceholderText('Ex: CND Federal');
        const slugInput = screen.getByPlaceholderText('Ex: cnd_federal');

        await user.type(nameInput, xssPayload);
        await user.type(slugInput, 'xss-slug');
        
        // Verifica se o valor no input é exatamente o que foi digitado (escapado pelo browser/React no value)
        expect(nameInput).toHaveValue(xssPayload);

        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        // Verifica se o payload chegou ao serviço de forma literal (proteção contra injeção na persistência)
        await waitFor(() => {
            expect(documentService.createType).toHaveBeenCalledWith(expect.objectContaining({
                name: xssPayload
            }));
        });
    });

    /**
     * CENÁRIO DE RESILIÊNCIA: Network Resilience and Rate Limiting
     * Simula erros 429 (Rate Limit) e 503 (Indisponibilidade) da API.
     */
    it('NETWORK: should handle 429 and 503 errors gracefully (Rate Limit & Maintenance)', async () => {
        const user = userEvent.setup();

        // Caso 1: 429 Too Many Requests
        vi.mocked(documentService.createType).mockRejectedValueOnce({
            response: { status: 429, data: { detail: 'Muitas requisições. Tente em breve.' } }
        });

        const { unmount } = render(<TypeModal {...defaultProps} />);
        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'Rate Limit Test');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'rate-test');
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Muitas requisições. Tente em breve.');
        });

        unmount();
        vi.clearAllMocks();

        // Caso 2: 503 Service Unavailable
        vi.mocked(documentService.createType).mockRejectedValueOnce({
            response: { status: 503, data: { detail: 'Serviço em manutenção.' } }
        });

        render(<TypeModal {...defaultProps} />);
        await user.type(screen.getByPlaceholderText('Ex: CND Federal'), 'Maintenance Test');
        await user.type(screen.getByPlaceholderText('Ex: cnd_federal'), 'maint-test');
        await user.click(screen.getByRole('button', { name: /Salvar/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Serviço em manutenção.');
        });
    });
});
