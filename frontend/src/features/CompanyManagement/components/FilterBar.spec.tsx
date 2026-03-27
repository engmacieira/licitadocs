import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from './FilterBar';

describe('FilterBar Component', () => {
    const defaultProps = {
        searchTerm: '',
        setSearchTerm: vi.fn(),
        filter: 'all' as const,
        setFilter: vi.fn(),
    };

    it('should render correctly with initial props', () => {
        render(<FilterBar {...defaultProps} />);

        expect(screen.getByPlaceholderText(/buscar por razão social ou cnpj/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /todas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /com pendências/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /regulares/i })).toBeInTheDocument();
    });

    it('should call setSearchTerm when typing in the search input', async () => {
        const user = userEvent.setup();
        render(<FilterBar {...defaultProps} />);

        const input = screen.getByPlaceholderText(/buscar por razão social ou cnpj/i);
        await user.type(input, 'Test Company');

        // Wait for debounce timeout
        await new Promise(r => setTimeout(r, 400));

        expect(defaultProps.setSearchTerm).toHaveBeenCalled();
    });

    it('should call setFilter when clicking filter buttons', async () => {
        const user = userEvent.setup();
        render(<FilterBar {...defaultProps} />);

        const pendingButton = screen.getByRole('button', { name: /com pendências/i });
        await user.click(pendingButton);
        expect(defaultProps.setFilter).toHaveBeenCalledWith('pending');

        const regularButton = screen.getByRole('button', { name: /regulares/i });
        await user.click(regularButton);
        expect(defaultProps.setFilter).toHaveBeenCalledWith('regular');

        const allButton = screen.getByRole('button', { name: /todas/i });
        await user.click(allButton);
        expect(defaultProps.setFilter).toHaveBeenCalledWith('all');
    });

    it('should highlight the active filter button', () => {
        const { rerender } = render(<FilterBar {...defaultProps} filter="pending" />);
        
        let pendingButton = screen.getByRole('button', { name: /com pendências/i });
        expect(pendingButton).toHaveClass('bg-slate-800');

        rerender(<FilterBar {...defaultProps} filter="regular" />);
        let regularButton = screen.getByRole('button', { name: /regulares/i });
        expect(regularButton).toHaveClass('bg-slate-800');
    });
});
