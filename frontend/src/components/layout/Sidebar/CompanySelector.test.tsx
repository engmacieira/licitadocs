import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanySelector } from './CompanySelector';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockCompanies = [
    { id: '1', razao_social: 'Company A', role: 'admin' },
    { id: '2', razao_social: 'Company B', role: 'user' },
];

const mockSwitchCompany = vi.fn();

describe('CompanySelector Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            companies: mockCompanies,
            currentCompany: mockCompanies[0],
            switchCompany: mockSwitchCompany,
        });
    });

    it('renders current company name and role', () => {
        render(
            <MemoryRouter>
                <CompanySelector />
            </MemoryRouter>
        );

        // Pode haver mais de uma ocorrência se o dropdown renderizar a lista
        expect(screen.getAllByText('Company A').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('renders "Selecione..." when no company is selected', () => {
        (useAuth as any).mockReturnValue({
            companies: mockCompanies,
            currentCompany: null,
            switchCompany: mockSwitchCompany,
        });

        render(
            <MemoryRouter>
                <CompanySelector />
            </MemoryRouter>
        );

        expect(screen.getByText('Selecione...')).toBeInTheDocument();
    });

    it('lists all companies in the dropdown', () => {
        render(
            <MemoryRouter>
                <CompanySelector />
            </MemoryRouter>
        );

        // Individual company items in dropdown (current company appears in button and list)
        expect(screen.getAllByText('Company A').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Company B').length).toBeGreaterThanOrEqual(1);
    });

    it('calls switchCompany when a company is clicked', () => {
        render(
            <MemoryRouter>
                <CompanySelector />
            </MemoryRouter>
        );

        const companyBButton = screen.getByText('Company B').closest('button');
        if (companyBButton) fireEvent.click(companyBButton);

        expect(mockSwitchCompany).toHaveBeenCalledWith('2');
    });

    it('renders "Nova Empresa" link', () => {
        render(
            <MemoryRouter>
                <CompanySelector />
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: /nova empresa/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/register');
    });
});
