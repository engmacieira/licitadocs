import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompanyHeader } from './CompanyHeader';

const mockCompany = {
    id: '123',
    razao_social: 'Empresa Teste LTDA',
    cnpj: '12.345.678/0001-99',
    email_corporativo: 'contato@empresa.com',
    is_admin_verified: false,
    is_contract_signed: false
};

describe('CompanyHeader', () => {
    it('deve renderizar os dados básicos da empresa corretamente', () => {
        render(
            <CompanyHeader 
                company={mockCompany} 
                onApprove={vi.fn()} 
                approving={false} 
            />
        );

        expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
        expect(screen.getByText('12.345.678/0001-99')).toBeInTheDocument();
        expect(screen.getByText('contato@empresa.com')).toBeInTheDocument();
        expect(screen.getByText('E')).toBeInTheDocument(); // Inicial da razão social
    });

    it('deve exibir o botão de aprovar quando não verificada', () => {
        render(
            <CompanyHeader 
                company={mockCompany} 
                onApprove={vi.fn()} 
                approving={false} 
            />
        );

        expect(screen.getByRole('button', { name: /aprovar documentação/i })).toBeInTheDocument();
        expect(screen.queryByText('Empresa Verificada')).not.toBeInTheDocument();
    });

    it('deve exibir status de verificada quando is_admin_verified for true', () => {
        render(
            <CompanyHeader 
                company={{ ...mockCompany, is_admin_verified: true }} 
                onApprove={vi.fn()} 
                approving={false} 
            />
        );

        expect(screen.getByText('Empresa Verificada')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /aprovar documentação/i })).not.toBeInTheDocument();
    });

    it('deve exibir o status correto do contrato', () => {
        const { rerender } = render(
            <CompanyHeader 
                company={mockCompany} 
                onApprove={vi.fn()} 
                approving={false} 
            />
        );

        expect(screen.getByText(/Status do Contrato: Pendente/i)).toBeInTheDocument();

        rerender(
            <CompanyHeader 
                company={{ ...mockCompany, is_contract_signed: true }} 
                onApprove={vi.fn()} 
                approving={false} 
            />
        );

        expect(screen.getByText(/Status do Contrato: Assinado/i)).toBeInTheDocument();
    });

    it('deve chamar onApprove ao clicar no botão', () => {
        const onApprove = vi.fn();
        render(
            <CompanyHeader 
                company={mockCompany} 
                onApprove={onApprove} 
                approving={false} 
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /aprovar documentação/i }));
        expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it('deve exibir estado de carregamento no botão quando approving for true', () => {
        render(
            <CompanyHeader 
                company={mockCompany} 
                onApprove={vi.fn()} 
                approving={true} 
            />
        );

        const button = screen.getByRole('button');
        // O componente Button (../../../components/ui/Button) deve lidar com isLoading. 
        // Normalmente ele desabilita o botão ou mostra um spinner.
        expect(button).toBeDisabled();
    });
});
