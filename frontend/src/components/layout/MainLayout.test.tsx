import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainLayout } from './MainLayout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mocks
vi.mock('./Sidebar', () => ({
    Sidebar: ({ className }: { className: string }) => <div data-testid="sidebar" className={className}>Sidebar</div>,
}));

vi.mock('./TopHeader', () => ({
    TopHeader: ({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) => (
        <button data-testid="top-header" onClick={onOpenMobileMenu}>TopHeader</button>
    ),
}));

vi.mock('../../features/AIConsultant/components/ChatWidget', () => ({
    ChatWidget: () => <div data-testid="chat-widget">ChatWidget</div>,
}));

describe('MainLayout Component', () => {
    it('renders sidebar, topheader and outlet area', () => {
        render(
            <MemoryRouter initialEntries={['/test']}>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route path="test" element={<div data-testid="outlet">Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('top-header')).toBeInTheDocument();
        expect(screen.getByTestId('outlet')).toBeInTheDocument();
        expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });

    it('opens mobile menu when TopHeader calls onOpenMobileMenu', () => {
        render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        // Mobile menu should be hidden initially
        expect(screen.queryByLabelText(/fechar menu/i)).not.toBeInTheDocument();

        // Trigger mobile menu
        const topHeader = screen.getByTestId('top-header');
        fireEvent.click(topHeader);

        // Mobile menu should now be visible
        expect(screen.getByLabelText(/fechar menu/i)).toBeInTheDocument();
        
        // Sidebar inside mobile menu
        const sidebars = screen.getAllByTestId('sidebar');
        expect(sidebars.length).toBe(2); // One desktop hidden, one mobile visible
    });

    it('closes mobile menu when close button is clicked', () => {
        render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        // Open
        fireEvent.click(screen.getByTestId('top-header'));

        // Close
        const closeButton = screen.getByLabelText(/fechar menu/i);
        fireEvent.click(closeButton);

        // Should be hidden
        expect(screen.queryByLabelText(/fechar menu/i)).not.toBeInTheDocument();
    });

    it('closes mobile menu when overlay is clicked', () => {
        const { container } = render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        // Open
        fireEvent.click(screen.getByTestId('top-header'));

        // Click overlay (shadow-blur-sm)
        const overlay = container.querySelector('.bg-slate-900\\/60');
        if (overlay) fireEvent.click(overlay);

        // Should be hidden
        expect(screen.queryByLabelText(/fechar menu/i)).not.toBeInTheDocument();
    });
});
