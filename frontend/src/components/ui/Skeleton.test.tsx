import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton Component', () => {
    it('renders with default classes', () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild;
        
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('rounded-md');
        expect(skeleton).toHaveClass('bg-slate-200');
    });

    it('applies custom className', () => {
        const { container } = render(<Skeleton className="w-10 h-10" />);
        const skeleton = container.firstChild;
        
        expect(skeleton).toHaveClass('w-10');
        expect(skeleton).toHaveClass('h-10');
    });

    it('passes additional props to the div', () => {
        const { container } = render(<Skeleton data-testid="skeleton-test" />);
        const skeleton = container.querySelector('[data-testid="skeleton-test"]');
        
        expect(skeleton).toBeInTheDocument();
    });
});
