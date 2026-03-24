import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmissionLinkDisplay } from './EmissionLinkDisplay';
import { emissionRuleService } from '../../../services/emissionRuleService';

// Mocking services
vi.mock('../../../services/emissionRuleService', () => ({
    emissionRuleService: {
        resolveLink: vi.fn(),
    }
}));

describe('EmissionLinkDisplay Component', () => {
    const defaultProps = {
        documentTypeId: 'type-1',
        companyId: 'comp-123',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show nothing if documentTypeId is null', () => {
        const { container } = render(<EmissionLinkDisplay {...defaultProps} documentTypeId={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('should show the title "Onde Emitir / Consultar"', () => {
        (emissionRuleService.resolveLink as any).mockReturnValue(new Promise(() => {})); // stays loading
        render(<EmissionLinkDisplay {...defaultProps} />);
        expect(screen.getByText('Onde Emitir / Consultar')).toBeInTheDocument();
    });

    it('should show the link when a rule with emission_link is found', async () => {
        (emissionRuleService.resolveLink as any).mockResolvedValue({
            id: 'rule-1',
            emission_link: 'https://site.com/emissao'
        });

        render(<EmissionLinkDisplay {...defaultProps} />);

        await waitFor(() => {
            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', 'https://site.com/emissao');
            expect(screen.getByText('https://site.com/emissao')).toBeInTheDocument();
        });
    });

    it('should show manual request button when no link but rule exists', async () => {
        (emissionRuleService.resolveLink as any).mockResolvedValue({
            id: 'rule-1',
            emission_link: null
        });

        render(<EmissionLinkDisplay {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Exige Solicitação Manual')).toBeInTheDocument();
        });
    });

    it('should show empty state when no rule is found', async () => {
        (emissionRuleService.resolveLink as any).mockResolvedValue(null);

        render(<EmissionLinkDisplay {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Padrão de Emissão Não Encontrado')).toBeInTheDocument();
        });
    });
});
