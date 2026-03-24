import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { RulesTabs } from './RulesTabs';
import type { ScopeTab } from '../RulesOrchestrator';

describe('RulesTabs Component', () => {
    const defaultProps = {
        activeTab: 'MUNICIPAL' as ScopeTab,
        setActiveTab: vi.fn(),
    };

    it('should render all tab options', () => {
        render(<RulesTabs {...defaultProps} />);
        
        expect(screen.getByText('Nacional')).toBeInTheDocument();
        expect(screen.getByText('Estadual')).toBeInTheDocument();
        expect(screen.getByText('Municipal')).toBeInTheDocument();
    });

    it('should show active styling for the selected tab', () => {
        const { rerender } = render(<RulesTabs {...defaultProps} activeTab="NATIONAL" />);
        
        const nationalBtn = screen.getByText('Nacional').closest('button');
        expect(nationalBtn).toHaveClass('border-blue-600 text-blue-600 bg-blue-50/50');

        rerender(<RulesTabs {...defaultProps} activeTab="STATE" />);
        const stateBtn = screen.getByText('Estadual').closest('button');
        expect(stateBtn).toHaveClass('border-blue-600 text-blue-600 bg-blue-50/50');
    });

    it('should call setActiveTab when a tab is clicked', () => {
        render(<RulesTabs {...defaultProps} />);
        
        const nationalBtn = screen.getByText('Nacional');
        fireEvent.click(nationalBtn);
        expect(defaultProps.setActiveTab).toHaveBeenCalledWith('NATIONAL');

        const stateBtn = screen.getByText('Estadual');
        fireEvent.click(stateBtn);
        expect(defaultProps.setActiveTab).toHaveBeenCalledWith('STATE');

        const municipalBtn = screen.getByText('Municipal');
        fireEvent.click(municipalBtn);
        expect(defaultProps.setActiveTab).toHaveBeenCalledWith('MUNICIPAL');
    });
});
