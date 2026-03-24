import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RulesOrchestrator } from './RulesOrchestrator';
import { emissionRuleService } from '../../services/emissionRuleService';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

// Mock Services
vi.mock('../../services/emissionRuleService', () => ({
    emissionRuleService: {
        getAll: vi.fn(),
        delete: vi.fn(),
    }
}));

vi.mock('../../services/documentService', () => ({
    documentService: {
        getTypes: vi.fn(),
    }
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

const mockRules = [
    {
        id: 'rule-1',
        document_type_id: 'doc-municipal',
        document_type_name: 'Alvará Municipal',
        city: 'São Paulo',
        state: 'SP',
        created_at: '2023-01-01',
    },
    {
        id: 'rule-2',
        document_type_id: 'doc-state',
        document_type_name: 'CND Estadual',
        state: 'RJ',
        created_at: '2023-01-02',
    },
    {
        id: 'rule-3',
        document_type_id: 'doc-national',
        document_type_name: 'Certidão Federal',
        created_at: '2023-01-03',
    }
];

const mockCategories = [
    {
        id: 'cat-1',
        name: 'Fiscal',
        types: [
            { id: 'doc-municipal', name: 'Alvará Municipal', scope: 'MUNICIPAL' },
            { id: 'doc-state', name: 'CND Estadual', scope: 'STATE' },
            { id: 'doc-national', name: 'Certidão Federal', scope: 'NATIONAL' },
        ]
    }
];

describe('RulesOrchestrator Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (emissionRuleService.getAll as any).mockResolvedValue(mockRules);
        (documentService.getTypes as any).mockResolvedValue(mockCategories);
        window.confirm = vi.fn().mockReturnValue(true);
        // Mock fetch for RuleModal (used in integration)
        global.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
        })) as any;
    });

    it('should show loading state initially and then render data', async () => {
        render(<RulesOrchestrator />);
        
        // Initial tab is MUNICIPAL
        await waitFor(() => {
            expect(screen.getByText('Alvará Municipal')).toBeInTheDocument();
            expect(screen.getByText('São Paulo - SP')).toBeInTheDocument();
        });

        expect(emissionRuleService.getAll).toHaveBeenCalled();
        expect(documentService.getTypes).toHaveBeenCalled();
    });

    it('should handle service errors with toast', async () => {
        (emissionRuleService.getAll as any).mockRejectedValue(new Error('API Error'));
        render(<RulesOrchestrator />);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar dados dos diretórios.');
        });
    });

    it('should filter rules by tab', async () => {
        render(<RulesOrchestrator />);
        
        // Municipal (Initial)
        await waitFor(() => {
            expect(screen.getByText('Alvará Municipal')).toBeInTheDocument();
            expect(screen.queryByText('CND Estadual')).not.toBeInTheDocument();
        });

        // Switch to State
        fireEvent.click(screen.getByText('Estadual'));
        expect(screen.getByText('CND Estadual')).toBeInTheDocument();
        expect(screen.queryByText('Alvará Municipal')).not.toBeInTheDocument();

        // Switch to National
        fireEvent.click(screen.getByText('Nacional'));
        expect(screen.getByText('Certidão Federal')).toBeInTheDocument();
        expect(screen.queryByText('CND Estadual')).not.toBeInTheDocument();
    });

    it('should search rules by term', async () => {
        render(<RulesOrchestrator />);
        
        // Tab is Municipal
        await waitFor(() => expect(screen.getByText('Alvará Municipal')).toBeInTheDocument());
        
        const searchInput = screen.getByPlaceholderText('Buscar regra...');
        fireEvent.change(searchInput, { target: { value: 'São Paulo' } });
        
        expect(screen.getByText('Alvará Municipal')).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
        expect(screen.queryByText('Alvará Municipal')).not.toBeInTheDocument();
        expect(screen.getByText('Nenhuma regra municipais encontrada.')).toBeInTheDocument();
    });

    it('should open new rule modal', async () => {
        render(<RulesOrchestrator />);
        await waitFor(() => expect(screen.getByText('Nova Regra')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Nova Regra'));
        
        // Wait for modal and its async UF loading
        await waitFor(() => {
            expect(screen.getByText('Nova Regra Municipal')).toBeInTheDocument();
        });
    });

    it('should delete a rule after confirmation', async () => {
        (emissionRuleService.delete as any).mockResolvedValue({});
        render(<RulesOrchestrator />);
        
        await waitFor(() => expect(screen.getByTitle('Excluir Regra')).toBeInTheDocument());
        
        const deleteBtn = screen.getByTitle('Excluir Regra');
        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta regra?');
        expect(emissionRuleService.delete).toHaveBeenCalledWith('rule-1');
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Regra excluída com sucesso.');
        });

        // loadData should be called again after successful deletion
        await waitFor(() => {
            expect(emissionRuleService.getAll).toHaveBeenCalledTimes(2);
        });
    });

    it('should NOT delete if window.confirm is rejected', async () => {
        (window.confirm as any).mockReturnValue(false);
        render(<RulesOrchestrator />);
        
        await waitFor(() => expect(screen.getByTitle('Excluir Regra')).toBeInTheDocument());
        
        fireEvent.click(screen.getByTitle('Excluir Regra'));
        expect(emissionRuleService.delete).not.toHaveBeenCalled();
    });
});
