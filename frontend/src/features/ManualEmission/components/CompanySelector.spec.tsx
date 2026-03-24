import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompanySelector } from './CompanySelector';

const mockRule = {
    id: 'rule-1',
    city: 'São Paulo',
    state: 'SP',
    document_type_id: 'doc-1',
    created_at: new Date().toISOString()
} as any;

const mockCompanies = [
    { id: 'comp-1', razao_social: 'Empresa SP', cnpj: '11.111.111/0001-11', cidade: 'São Paulo', estado: 'SP' },
    { id: 'comp-2', razao_social: 'Empresa RJ', cnpj: '22.222.222/0002-22', cidade: 'Rio de Janeiro', estado: 'RJ' },
];

describe('CompanySelector', () => {
    it('deve renderizar apenas empresas da mesma cidade/estado da regra por padrão', () => {
        const setSelectedCompanyId = vi.fn();
        render(
            <CompanySelector 
                companies={mockCompanies} 
                selectedCompanyId="" 
                setSelectedCompanyId={setSelectedCompanyId} 
                rule={mockRule} 
            />
        );

        expect(screen.getByText(/Empresa SP/i)).toBeInTheDocument();
        expect(screen.queryByText(/Empresa RJ/i)).not.toBeInTheDocument();
    });

    it('deve renderizar todas as empresas quando "Mostrar todas" estiver marcado', () => {
        const setSelectedCompanyId = vi.fn();
        render(
            <CompanySelector 
                companies={mockCompanies} 
                selectedCompanyId="" 
                setSelectedCompanyId={setSelectedCompanyId} 
                rule={mockRule} 
            />
        );

        const checkbox = screen.getByLabelText(/Mostrar todas/i);
        fireEvent.click(checkbox);

        expect(screen.getByText(/Empresa SP/i)).toBeInTheDocument();
        expect(screen.getByText(/Empresa RJ/i)).toBeInTheDocument();
    });

    it('deve chamar setSelectedCompanyId ao selecionar uma empresa', () => {
        const setSelectedCompanyId = vi.fn();
        render(
            <CompanySelector 
                companies={mockCompanies} 
                selectedCompanyId="" 
                setSelectedCompanyId={setSelectedCompanyId} 
                rule={mockRule} 
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'comp-1' } });

        expect(setSelectedCompanyId).toHaveBeenCalledWith('comp-1');
    });

    it('deve exibir mensagem de aviso quando nenhuma empresa corresponder ao filtro geográfico', () => {
        const localCompanies = [
            { id: 'comp-2', razao_social: 'Empresa RJ', cnpj: '22.222.222/0002-22', cidade: 'Rio de Janeiro', estado: 'RJ' },
        ];
        render(
            <CompanySelector 
                companies={localCompanies} 
                selectedCompanyId="" 
                setSelectedCompanyId={vi.fn()} 
                rule={mockRule} 
            />
        );

        expect(screen.getByText(/Nenhuma empresa com endereço registado em/i)).toBeInTheDocument();
        expect(screen.getByText(/São Paulo\/SP/i)).toBeInTheDocument();
    });
});
