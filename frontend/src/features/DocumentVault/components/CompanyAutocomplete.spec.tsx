import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { CompanyAutocomplete } from './CompanyAutocomplete';
import type { Company } from '../../../services/companyService';

describe('CompanyAutocomplete Component', () => {
    const mockOnChange = vi.fn();

    // Utilizamos Partial para simular apenas os campos que o componente realmente usa
    const mockCompanies = [
        { id: 'comp-1', razao_social: 'Tech Solutions', cnpj: '12.345.678/0001-99' },
        { id: 'comp-2', razao_social: 'Global Corp', cnpj: '98.765.432/0001-11' }
    ] as Company[];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o placeholder padrão quando nenhum valor for passado', () => {
        render(
            <CompanyAutocomplete
                companies={mockCompanies}
                value=""
                onChange={mockOnChange}
            />
        );

        expect(screen.getByText('Buscar empresa ou CNPJ...')).toBeInTheDocument();
    });

    it('deve exibir a empresa corretamente quando um valor inicial for passado', () => {
        render(
            <CompanyAutocomplete
                companies={mockCompanies}
                value="comp-2"
                onChange={mockOnChange}
            />
        );

        // O react-select renderiza o texto da opção selecionada no DOM
        expect(screen.getByText('Global Corp - 98.765.432/0001-11')).toBeInTheDocument();
    });

    it('deve permitir a busca e disparar onChange ao selecionar uma opção', async () => {
        const user = userEvent.setup();

        render(
            <CompanyAutocomplete
                companies={mockCompanies}
                value=""
                onChange={mockOnChange}
            />
        );

        // O react-select possui um input escondido com role="combobox"
        const input = screen.getByRole('combobox');

        // Simula o clique e a digitação do usuário
        await user.click(input);
        await user.type(input, 'Tech Solutions');

        // Aguarda a opção renderizada aparecer na lista suspensa
        const option = await screen.findByText('Tech Solutions - 12.345.678/0001-99');
        expect(option).toBeInTheDocument();

        // Clica na opção
        await user.click(option);

        // Verifica se a função onChange foi chamada enviando o ID correto
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('comp-1');
    });

    it('deve exibir mensagem de nenhum resultado quando a busca não bater com os dados', async () => {
        const user = userEvent.setup();

        render(
            <CompanyAutocomplete
                companies={mockCompanies}
                value=""
                onChange={mockOnChange}
            />
        );

        const input = screen.getByRole('combobox');
        await user.click(input);
        await user.type(input, 'Empresa Inexistente');

        // A propriedade noOptionsMessage que configuramos deve ser exibida
        expect(await screen.findByText('Nenhuma empresa encontrada')).toBeInTheDocument();
    });
});