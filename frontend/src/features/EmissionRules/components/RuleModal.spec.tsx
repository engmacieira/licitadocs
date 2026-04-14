import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RuleModal } from './RuleModal';
import { emissionRuleService } from '../../../services/emissionRuleService';
import type { DocumentTypeDTO } from '../../../types';
import type { EmissionRuleDTO } from '../../../types';
import type { ScopeTab } from '../RulesOrchestrator';

// Mock Services
vi.mock('../../../services/emissionRuleService', () => ({
    emissionRuleService: {
        create: vi.fn(),
        update: vi.fn(),
    }
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

const mockDocTypes: DocumentTypeDTO[] = [
    { id: '1', name: 'Alvará', slug: 'alvara', scope: 'MUNICIPAL', validity_days_default: 365 },
    { id: '2', name: 'CND Estadual', slug: 'cnd-est', scope: 'STATE', validity_days_default: 180 },
];

const mockUFs = [
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
];

const mockCities = [
    { nome: 'São Paulo' },
    { nome: 'Campinas' },
];

describe('RuleModal Component', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        activeTab: 'MUNICIPAL' as ScopeTab,
        editingRule: null as EmissionRuleDTO | null,
        docTypes: mockDocTypes,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Global fetch mock
        global.fetch = vi.fn((url) => {
            if (url.includes('/localidades/estados?')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockUFs),
                });
            }
            if (url.includes('/municipios?')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockCities),
                });
            }
            return Promise.reject(new Error('Unknown URL: ' + url));
        }) as any;
    });

    it('should not render when isOpen is false', () => {
        render(<RuleModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText(/Nova Regra/i)).not.toBeInTheDocument();
    });

    it('should render creation mode title correctly based on tab', async () => {
        const { rerender } = render(<RuleModal {...defaultProps} activeTab="NATIONAL" />);
        expect(screen.getByText('Nova Regra Nacional')).toBeInTheDocument();

        await act(async () => {
            rerender(<RuleModal {...defaultProps} activeTab="STATE" />);
        });
        expect(screen.getByText('Nova Regra Estadual')).toBeInTheDocument();

        await act(async () => {
            rerender(<RuleModal {...defaultProps} activeTab="MUNICIPAL" />);
        });
        expect(screen.getByText('Nova Regra Municipal')).toBeInTheDocument();
    });

    it('should load UFs when activeTab is STATE or MUNICIPAL', async () => {
        render(<RuleModal {...defaultProps} activeTab="MUNICIPAL" />);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/localidades/estados'));
        });
        expect(await screen.findByText('SP - São Paulo')).toBeInTheDocument();
    });

    it('should load cities when a state is selected in MUNICIPAL tab', async () => {
        render(<RuleModal {...defaultProps} activeTab="MUNICIPAL" />);
        
        // Wait for UFs to load
        const stateSelect = await screen.findByLabelText(/Estado \(UF\)/i);
        
        fireEvent.change(stateSelect, { target: { value: 'SP' } });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/estados/SP/municipios'));
        });
        expect(await screen.findByText('Campinas')).toBeInTheDocument();
    });

    it('should show validation error if required fields are missing', async () => {
        render(<RuleModal {...defaultProps} activeTab="MUNICIPAL" />);
        
        const submitBtn = screen.getByText('Criar Regra');
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(emissionRuleService.create).not.toHaveBeenCalled();
    });

    it('should call emissionRuleService.create and close on success', async () => {
        (emissionRuleService.create as any).mockResolvedValue({ id: 'new-id' });
        render(<RuleModal {...defaultProps} activeTab="NATIONAL" />);

        fireEvent.change(screen.getByLabelText(/Tipo de Documento/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/Portal Web/i), { target: { value: 'https://test.com' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Criar Regra'));
        });

        await waitFor(() => {
            expect(emissionRuleService.create).toHaveBeenCalledWith(expect.objectContaining({
                document_type_id: '1',
                emission_link: 'https://test.com',
            }));
        });

        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should populate fields in edit mode', async () => {
        const editingRule: EmissionRuleDTO = {
            id: 'edit-1',
            document_type_id: '1',
            state: 'SP',
            city: 'São Paulo',
            emission_link: 'https://edit.com',
            created_at: '2023-01-01',
        };

        render(<RuleModal {...defaultProps} editingRule={editingRule} activeTab="MUNICIPAL" />);

        expect(screen.getByText('Editar Regra')).toBeInTheDocument();
        
        // Wait for UFs to load so the value can be correctly displayed in the select
        await screen.findByText('SP - São Paulo');

        await waitFor(() => {
            expect(screen.getByLabelText(/Tipo de Documento/i)).toHaveValue('1');
            expect(screen.getByLabelText(/Estado \(UF\)/i)).toHaveValue('SP');
        });

        // The city has a 400ms timeout in the component. 
        // We wait for the option to appear and the value to be set.
        await waitFor(async () => {
            const citySelect = screen.getByLabelText(/Município/i);
            expect(citySelect).toHaveValue('São Paulo');
        }, { timeout: 3000 });

        expect(screen.getByLabelText(/Portal Web/i)).toHaveValue('https://edit.com');
    });

    it('should call emissionRuleService.update when editing', async () => {
        const editingRule: EmissionRuleDTO = {
            id: 'edit-1',
            document_type_id: '1',
            created_at: '2023-01-01',
        };

        (emissionRuleService.update as any).mockResolvedValue({ ...editingRule });
        render(<RuleModal {...defaultProps} editingRule={editingRule} activeTab="NATIONAL" />);

        // Give it a moment to render
        await screen.findByText('Editar Regra');

        fireEvent.change(screen.getByLabelText(/Portal Web/i), { target: { value: 'https://updated.com' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Guardar'));
        });

        await waitFor(() => {
            expect(emissionRuleService.update).toHaveBeenCalledWith('edit-1', expect.objectContaining({
                emission_link: 'https://updated.com',
            }));
        });
    });
});
