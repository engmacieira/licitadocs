import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach, afterEach } from 'vitest';
import { ExpiringDocsPanel } from './ExpiringDocsPanel';
import type { DocumentDTO } from '@/types';

describe('ExpiringDocsPanel', () => {
    const mockOnNavigate = vi.fn();

    const mockDocs: DocumentDTO[] = [
        {
            id: '1',
            title: 'Certidão Negativa Federal',
            filename: 'cert_federal.pdf',
            company_name: 'Empresa A',
            expiration_date: '2026-03-20T12:00:00Z',
            status: 'valid',
            created_at: '2026-01-01T12:00:00Z',
            is_structured: true
        },
        {
            id: '2',
            title: 'Alvará de Funcionamento',
            filename: 'alvara.pdf',
            company_name: 'Empresa B',
            expiration_date: '2026-04-10T12:00:00Z',
            status: 'valid',
            created_at: '2026-01-01T12:00:00Z',
            is_structured: true
        }
    ];

    beforeEach(() => {
        vi.useFakeTimers();
        // Fixando a data em 2026-03-22
        vi.setSystemTime(new Date('2026-03-22T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('deve renderizar o estado de carregamento corretamente', () => {
        render(<ExpiringDocsPanel loading={true} expiringDocs={[]} onNavigate={mockOnNavigate} />);
        
        // Deve mostrar os skeletons (podemos buscar por classes ou data-testid se tivessem, 
        // mas aqui vamos ver se o texto de vazio NÃO aparece)
        expect(screen.queryByText('Tudo em dia')).not.toBeInTheDocument();
        // O componente usa Skeleton que renderiza divs com a classe animate-pulse
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve renderizar a mensagem de "Tudo em dia" quando não há documentos', () => {
        render(<ExpiringDocsPanel loading={false} expiringDocs={[]} onNavigate={mockOnNavigate} />);
        
        expect(screen.getByText('Tudo em dia')).toBeInTheDocument();
        expect(screen.getByText(/Não existem documentos ou certidões a vencer/i)).toBeInTheDocument();
        expect(screen.queryByText('Ver calendário completo')).not.toBeInTheDocument();
    });

    it('deve renderizar a lista de documentos corretamente', () => {
        render(<ExpiringDocsPanel loading={false} expiringDocs={mockDocs} onNavigate={mockOnNavigate} />);
        
        expect(screen.getByText('Certidão Negativa Federal')).toBeInTheDocument();
        expect(screen.getByText('Empresa A')).toBeInTheDocument();
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        expect(screen.getByText('Empresa B')).toBeInTheDocument();
        
        // Verifica se o botão de navegação aparece
        expect(screen.getByText('Ver calendário completo')).toBeInTheDocument();
    });

    it('deve aplicar estilos corretos para documentos vencidos e a vencer', () => {
        render(<ExpiringDocsPanel loading={false} expiringDocs={mockDocs} onNavigate={mockOnNavigate} />);
        
        // Documento 1: 2026-03-20 (Vencido, pois hoje é 2026-03-22)
        const expiredBadge = screen.getByText(/Vencido em/i);
        expect(expiredBadge).toHaveTextContent(/20\/03/);
        expect(expiredBadge.className).toContain('text-red-700');
        expect(expiredBadge.className).toContain('bg-red-50');

        // Documento 2: 2026-04-10 (A vencer)
        const upcomingBadge = screen.getByText(/Vence a/i);
        expect(upcomingBadge).toHaveTextContent(/10\/04/);
        expect(upcomingBadge.className).toContain('text-amber-700');
        expect(upcomingBadge.className).toContain('bg-amber-50');
    });

    it('deve limitar a exibição aos primeiros 5 documentos', () => {
        const manyDocs = Array.from({ length: 10 }, (_, i) => ({
            ...mockDocs[0],
            id: `${i}`,
            title: `Doc ${i}`
        }));

        render(<ExpiringDocsPanel loading={false} expiringDocs={manyDocs} onNavigate={mockOnNavigate} />);
        
        // Verifica se apenas 5 itens são renderizados na lista
        // (Excluindo o título do painel que pode ter o mesmo texto se não formos cuidadosos)
        const items = screen.getAllByRole('heading', { level: 3 }).filter(h => h.textContent?.startsWith('Doc '));
        expect(items).toHaveLength(5);
    });

    it('deve disparar onNavigate ao clicar no botão de ver detalhes', () => {
        render(<ExpiringDocsPanel loading={false} expiringDocs={mockDocs} onNavigate={mockOnNavigate} />);
        
        fireEvent.click(screen.getByText('Ver calendário completo'));
        expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });
});
