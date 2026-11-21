import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsCard } from './StatsCard';
import { Users } from 'lucide-react';

describe('StatsCard Component', () => {
    const defaultProps = {
        title: 'Total Users',
        value: '1,240',
        icon: Users,
    };

    it('renders title and value correctly', () => {
        render(<StatsCard {...defaultProps} />);
        
        expect(screen.getByText(/total users/i)).toBeInTheDocument();
        expect(screen.getByText('1,240')).toBeInTheDocument();
    });

    it('renders the icon', () => {
        const { container } = render(<StatsCard {...defaultProps} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders description and trend up', () => {
        render(
            <StatsCard 
                {...defaultProps} 
                description="from last month" 
                trend="up" 
            />
        );
        
        expect(screen.getByText(/from last month/i)).toBeInTheDocument();
        expect(screen.getByText('↑')).toBeInTheDocument();
        expect(screen.getByText('↑')).toHaveClass('text-green-600');
    });

    it('renders description and trend down', () => {
        render(
            <StatsCard 
                {...defaultProps} 
                description="from last month" 
                trend="down" 
            />
        );
        
        expect(screen.getByText('↓')).toBeInTheDocument();
        expect(screen.getByText('↓')).toHaveClass('text-red-600');
    });

    it('applies color themes correctly', () => {
        const { rerender, container } = render(<StatsCard {...defaultProps} color="green" />);
        let iconContainer = container.querySelector('.h-12.w-12');
        expect(iconContainer).toHaveClass('bg-green-50');
        expect(iconContainer).toHaveClass('text-green-600');

        rerender(<StatsCard {...defaultProps} color="red" />);
        iconContainer = container.querySelector('.h-12.w-12');
        expect(iconContainer).toHaveClass('bg-red-50');
    });

    it('renders description without arrow when trend is neutral', () => {
        render(
            <StatsCard
                {...defaultProps}
                description="stable this month"
                trend="neutral"
            />
        );

        expect(screen.getByText(/stable this month/i)).toBeInTheDocument();
        expect(screen.queryByText('↑')).not.toBeInTheDocument();
        expect(screen.queryByText('↓')).not.toBeInTheDocument();
    });

    it('renders skeleton when loading is true', () => {
        const { container } = render(<StatsCard {...defaultProps} loading />);
        
        // Should have multiple skeleton elements
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
        
        // Should NOT render title and value text
        expect(screen.queryByText(/total users/i)).not.toBeInTheDocument();
        expect(screen.queryByText('1,240')).not.toBeInTheDocument();
    });
});
