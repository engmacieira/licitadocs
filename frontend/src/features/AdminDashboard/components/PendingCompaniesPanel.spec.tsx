import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { PendingCompaniesPanel } from './PendingCompaniesPanel';
import type { Company } from '../../../types';

// Mock do hook de navegação do react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

describe('PendingCompaniesPanel', () => {
    const mockCompanies: Company[] = [
        {
            id: '1',
            razao_social: 'Empresa Alpha Ltda',
            cnpj: '11.111.111/0001-11',
            is_active: true,
            created_at: '2026-01-01T10:00:00Z',
            is_admin_verified: false
        },
        {
            id: '2',
            razao_social: 'Empresa Beta SA',
            cnpj: '22.222.222/0001-22',
            is_active: true,
            created_at: '2026-01-02T10:00:00Z',
            is_admin_verified: false
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o estado de carregamento corretamente', () => {
        render(<PendingCompaniesPanel loading={true} companies={[]} />);

        expect(screen.queryByText('Tudo verificado')).not.toBeInTheDocument();
        // O componente usa Skeleton que renderiza divs com a classe animate-pulse
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve renderizar a mensagem de "Tudo verificado" quando não há empresas pendentes', () => {
        render(<PendingCompaniesPanel loading={false} companies={[]} />);

        expect(screen.getByText('Tudo verificado')).toBeInTheDocument();
        expect(screen.getByText(/Não existem empresas aguardando aprovação administrativa no momento/i)).toBeInTheDocument();
    });

    it('deve renderizar a lista de empresas corretamente', () => {
        render(<PendingCompaniesPanel loading={false} companies={mockCompanies} />);

        expect(screen.getByText('Empresa Alpha Ltda')).toBeInTheDocument();
        expect(screen.getByText('CNPJ: 11.111.111/0001-11')).toBeInTheDocument();

        expect(screen.getByText('Empresa Beta SA')).toBeInTheDocument();
        expect(screen.getByText('CNPJ: 22.222.222/0001-22')).toBeInTheDocument();
    });

    it('deve navegar para a página de detalhes da empresa ao clicar em "Analisar"', () => {
        render(<PendingCompaniesPanel loading={false} companies={mockCompanies} />);

        // Pega o primeiro botão "Analisar" (que corresponde à Empresa Alpha com id '1')
        const btnAnalisar = screen.getAllByText(/Analisar/i)[0];
        fireEvent.click(btnAnalisar);

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies/1');
    });

    it('deve limitar a exibição a 5 itens e mostrar o botão "Ver mais" com a contagem correta', () => {
        // Criando uma lista com 7 empresas falsas
        const manyCompanies = Array.from({ length: 7 }, (_, i) => ({
            ...mockCompanies[0],
            id: `${i}`,
            razao_social: `Empresa ${i}`
        }));

        render(<PendingCompaniesPanel loading={false} companies={manyCompanies} />);

        // Verifica se os botões "Analisar" aparecem exatamente 5 vezes (limite do slice)
        const buttonsAnalisar = screen.getAllByText(/Analisar/i);
        expect(buttonsAnalisar).toHaveLength(5);

        // Verifica se a string calcula corretamente as restantes (7 - 5 = 2)
        const verMaisBtn = screen.getByText('Ver mais 2 empresas pendentes');
        expect(verMaisBtn).toBeInTheDocument();

        // Verifica se clicar no botão de "Ver mais" redireciona para a listagem global de empresas
        fireEvent.click(verMaisBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/companies');
    });
});