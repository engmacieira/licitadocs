import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton'; // Ajuste o caminho se necessário

describe('Skeleton Component', () => {
    it('deve renderizar corretamente com as classes padrão', () => {
        // Usamos data-testid para encontrar elementos que não têm texto
        render(<Skeleton data-testid="skeleton-base" />);

        const skeleton = screen.getByTestId('skeleton-base');
        expect(skeleton).toBeInTheDocument();
        expect(skeleton).toHaveClass('animate-pulse', 'bg-slate-200');
    });

    it('deve aceitar e mesclar classes customizadas via tailwind-merge', () => {
        render(<Skeleton data-testid="skeleton-custom" className="h-10 w-20 custom-class" />);

        const skeleton = screen.getByTestId('skeleton-custom');
        // Confirma se manteve as bases e adicionou as novas
        expect(skeleton).toHaveClass('animate-pulse', 'bg-slate-200', 'h-10', 'w-20', 'custom-class');
    });
});