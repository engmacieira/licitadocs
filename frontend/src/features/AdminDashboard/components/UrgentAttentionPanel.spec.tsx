import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, afterEach } from 'vitest';
import { UrgentAttentionPanel } from './UrgentAttentionPanel';

describe('UrgentAttentionPanel', () => {
    const mockOnNavigate = vi.fn();

    const mockGroupedIrregular = [
        {
            companyName: 'Empresa Alfa',
            count: 3,
            type: 'error' as const
        },
        {
            companyName: 'Empresa Beta',
            count: 1,
            type: 'irregular' as const
        }
    ];

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o estado de carregamento corretamente', () => {
        render(<UrgentAttentionPanel loading={true} groupedIrregular={[]} onNavigate={mockOnNavigate} />);
        
        expect(screen.queryByText('Cofres Limpos')).not.toBeInTheDocument();
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve renderizar a mensagem de "Cofres Limpos" quando não há irregularidades', () => {
        render(<UrgentAttentionPanel loading={false} groupedIrregular={[]} onNavigate={mockOnNavigate} />);
        
        expect(screen.getByText('Cofres Limpos')).toBeInTheDocument();
        expect(screen.getByText(/Não existem empresas com documentos irregulares/i)).toBeInTheDocument();
        expect(screen.queryByText('Ver todas as pendências')).not.toBeInTheDocument();
    });

    it('deve renderizar a lista de empresas com problemas corretamente', () => {
        render(<UrgentAttentionPanel loading={false} groupedIrregular={mockGroupedIrregular} onNavigate={mockOnNavigate} />);
        
        expect(screen.getByText('Empresa Alfa')).toBeInTheDocument();
        expect(screen.getByText('3 pendências')).toBeInTheDocument();
        expect(screen.getByText('Erro na Emissão')).toBeInTheDocument();

        expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
        expect(screen.getByText('1 pendência')).toBeInTheDocument();
        expect(screen.getByText('Irregular')).toBeInTheDocument();
        
        expect(screen.getByText('Ver todas as pendências')).toBeInTheDocument();
    });

    it('deve aplicar estilos corretos baseados no tipo de erro', () => {
        const { rerender } = render(<UrgentAttentionPanel loading={false} groupedIrregular={[mockGroupedIrregular[0]]} onNavigate={mockOnNavigate} />);
        
        // Erro na Emissão (Red)
        const errorBadge = screen.getByText('Erro na Emissão');
        expect(errorBadge.className).toContain('text-red-700');
        expect(errorBadge.className).toContain('bg-red-100');

        rerender(<UrgentAttentionPanel loading={false} groupedIrregular={[mockGroupedIrregular[1]]} onNavigate={mockOnNavigate} />);
        
        // Irregular (Orange/Amber)
        const irregularBadge = screen.getByText('Irregular');
        expect(irregularBadge.className).toContain('text-orange-700');
        expect(irregularBadge.className).toContain('bg-orange-100');
    });

    it('deve disparar onNavigate ao clicar nos botões de resolução', () => {
        render(<UrgentAttentionPanel loading={false} groupedIrregular={mockGroupedIrregular} onNavigate={mockOnNavigate} />);
        
        // Botão no cabeçalho
        fireEvent.click(screen.getByText('Ver todas as pendências'));
        expect(mockOnNavigate).toHaveBeenCalledTimes(1);

        // Botão "Resolver" na linha da empresa
        const resolverButtons = screen.getAllByText(/Resolver/i);
        fireEvent.click(resolverButtons[0]);
        expect(mockOnNavigate).toHaveBeenCalledTimes(2);
    });
});
