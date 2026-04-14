import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { RulesList } from './RulesList';
import type { EmissionRuleDTO } from '../../../types';
import type { ScopeTab } from '../RulesOrchestrator';

const mockRules: EmissionRuleDTO[] = [
    {
        id: '1',
        document_type_id: 'doc-1',
        document_type_name: 'Alvará de Funcionamento',
        state: 'SP',
        city: 'São Paulo',
        emission_link: 'https://sp.gov.br',
        contact_email: 'contato@sp.gov.br',
        created_at: '2023-01-01',
    },
    {
        id: '2',
        document_type_id: 'doc-2',
        document_type_name: 'Certidão de Débitos',
        state: 'RJ',
        city: 'Rio de Janeiro',
        contact_email: 'contato@rj.gov.br',
        created_at: '2023-01-02',
    }
];

describe('RulesList Component', () => {
    const defaultProps = {
        loading: false,
        rules: mockRules,
        activeTab: 'MUNICIPAL' as ScopeTab,
        searchTerm: '',
        setSearchTerm: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
    };

    it('should render loading state', () => {
        render(<RulesList {...defaultProps} loading={true} />);
        // RulesList uses Skeleton when loading
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render empty state message', () => {
        render(<RulesList {...defaultProps} rules={[]} />);
        expect(screen.getByText('Nenhuma regra municipais encontrada.')).toBeInTheDocument();
    });

    it('should render correctly for different scopes (tabs)', () => {
        const { rerender } = render(<RulesList {...defaultProps} activeTab="NATIONAL" rules={[]} />);
        expect(screen.getByText('Regras Nacionais')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma regra nacionais encontrada.')).toBeInTheDocument();

        rerender(<RulesList {...defaultProps} activeTab="STATE" rules={[]} />);
        expect(screen.getByText('Regras Estaduais')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma regra estaduais encontrada.')).toBeInTheDocument();
    });

    it('should render list of rules', () => {
        render(<RulesList {...defaultProps} />);
        
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        expect(screen.getByText('São Paulo - SP')).toBeInTheDocument();
        expect(screen.getByText('Certidão de Débitos')).toBeInTheDocument();
        expect(screen.getByText('Rio de Janeiro - RJ')).toBeInTheDocument();
    });

    it('should show contact info badges if present', () => {
        render(<RulesList {...defaultProps} />);
        
        expect(screen.getByText('Portal Web')).toBeInTheDocument();
        expect(screen.getAllByText('Email de Contato')).toHaveLength(2);
    });

    it('should call setSearchTerm when typing in search input', () => {
        render(<RulesList {...defaultProps} />);
        
        const input = screen.getByPlaceholderText('Buscar regra...');
        fireEvent.change(input, { target: { value: 'test' } });
        
        expect(defaultProps.setSearchTerm).toHaveBeenCalledWith('test');
    });

    it('should call onEdit when edit button is clicked', () => {
        render(<RulesList {...defaultProps} />);
        
        const editBtns = screen.getAllByTitle('Editar Regra');
        fireEvent.click(editBtns[0]);
        
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockRules[0]);
    });

    it('should call onDelete when delete button is clicked', () => {
        render(<RulesList {...defaultProps} />);
        
        const deleteBtns = screen.getAllByTitle('Excluir Regra');
        fireEvent.click(deleteBtns[0]);
        
        expect(defaultProps.onDelete).toHaveBeenCalledWith(mockRules[0].id);
    });
});
