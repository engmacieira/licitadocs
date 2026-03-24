import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
    it('renders correctly with children', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
    });

    it('applies default primary variant and md size classes', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toHaveClass('bg-blue-600'); // primary variant class
        expect(button).toHaveClass('h-10'); // md size class
    });

    it('applies different variants correctly', () => {
        const { rerender } = render(<Button variant="danger">Danger</Button>);
        let button = screen.getByRole('button', { name: /danger/i });
        expect(button).toHaveClass('bg-red-600');

        rerender(<Button variant="secondary">Secondary</Button>);
        button = screen.getByRole('button', { name: /secondary/i });
        expect(button).toHaveClass('bg-slate-100');

        rerender(<Button variant="outline">Outline</Button>);
        button = screen.getByRole('button', { name: /outline/i });
        expect(button).toHaveClass('border-slate-200');

        rerender(<Button variant="ghost">Ghost</Button>);
        button = screen.getByRole('button', { name: /ghost/i });
        expect(button).toHaveClass('hover:bg-slate-100');
    });

    it('applies different sizes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        let button = screen.getByRole('button', { name: /small/i });
        expect(button).toHaveClass('h-8');

        rerender(<Button size="lg">Large</Button>);
        button = screen.getByRole('button', { name: /large/i });
        expect(button).toHaveClass('h-12');
    });

    it('shows loading spinner and is disabled when isLoading is true', () => {
        render(<Button isLoading>Submit</Button>);
        const button = screen.getByRole('button', { name: /submit/i });
        
        expect(button).toBeDisabled();
        // Check for loader (using data-testid if necessary, but lucide icons don't always have names)
        // Since the guideline says avoid testId, let's see if we can find it by class or if it's there.
        // Actually, the Loader2 has class "animate-spin".
        const spinner = button.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole('button', { name: /disabled/i });
        expect(button).toBeDisabled();
    });

    it('calls onClick when clicked', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick}>Click</Button>);
        
        const button = screen.getByRole('button', { name: /click/i });
        await user.click(button);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick} disabled>Click</Button>);
        
        const button = screen.getByRole('button', { name: /click/i });
        await user.click(button);
        
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when isLoading is true', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick} isLoading>Click</Button>);
        
        const button = screen.getByRole('button', { name: /click/i });
        await user.click(button);
        
        expect(handleClick).not.toHaveBeenCalled();
    });
});
