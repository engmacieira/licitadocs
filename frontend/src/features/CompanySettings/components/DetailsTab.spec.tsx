import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailsTab } from './DetailsTab';
import { useForm } from 'react-hook-form';
import type { CompanyFormSchema } from '../CompanySettingsOrchestrator';

const mockUfs = [
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }
];

const mockCities = [
    { nome: 'São Paulo' },
    { nome: 'Campinas' }
];

const mockCompany = {
    cnpj: '12.345.678/0001-99',
    razao_social: 'Empresa Teste LTDA'
};

const mockStatusFlags = {
    data: true,
    contract: false,
    payment: true,
    approval: false
};

const TestWrapper = ({ onSaveDetails, selectedUf = 'SP', cities = mockCities }: any) => {
    const companyForm = useForm<CompanyFormSchema>({
        defaultValues: {
            razao_social: 'Empresa Teste LTDA',
            nome_fantasia: 'Nome Fantasia',
            email_corporativo: 'test@empresa.com',
            telefone: '(11) 1234-5678',
            responsavel_nome: 'Responsável',
            cep: '01001-000',
            logradouro: 'Praça da Sé',
            numero: '100',
            bairro: 'Centro',
            estado: 'SP',
            cidade: 'São Paulo'
        }
    });

    return (
        <DetailsTab
            currentCompany={mockCompany}
            companyForm={companyForm}
            onSaveDetails={onSaveDetails}
            ufs={mockUfs}
            cities={cities}
            selectedUf={selectedUf}
            statusFlags={mockStatusFlags}
        />
    );
};

describe('DetailsTab', () => {
    it('deve renderizar informações gerais da empresa', () => {
        render(<TestWrapper onSaveDetails={vi.fn()} />);

        expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
        // CNPJ está disabled e não tem label associado corretamente. Usando id ou display value.
        expect(screen.getByDisplayValue(mockCompany.cnpj)).toBeDisabled();
        expect(screen.getByText('Razão Social')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Empresa Teste LTDA')).toBeInTheDocument();
    });

    it('deve renderizar campos de endereço e selects do IBGE', () => {
        render(<TestWrapper onSaveDetails={vi.fn()} />);

        expect(screen.getByText('Endereço')).toBeInTheDocument();
        expect(screen.getByDisplayValue('01001-000')).toBeInTheDocument();
        
        const stateSelect = screen.getByText('Estado').parentElement?.querySelector('select');
        expect(stateSelect).toHaveValue('SP');
        expect(stateSelect).toContainElement(screen.getByText('RJ'));

        const citySelect = screen.getByText('Cidade').parentElement?.querySelector('select');
        expect(citySelect).toHaveValue('São Paulo');
        expect(citySelect).toContainElement(screen.getByText('Campinas'));
    });

    it('deve desabilitar select de cidade se nenhuma UF estiver selecionada', () => {
        render(<TestWrapper onSaveDetails={vi.fn()} selectedUf="" cities={[]} />);
        const citySelect = screen.getByText('Cidade').parentElement?.querySelector('select');
        expect(citySelect).toBeDisabled();
    });

    it('deve renderizar o cartão de situação cadastral com flags corretas', () => {
        render(<TestWrapper onSaveDetails={vi.fn()} />);

        expect(screen.getByText('Situação Cadastral')).toBeInTheDocument();
        
        // Dados da Empresa (true)
        expect(screen.getByText('Dados da Empresa')).toBeInTheDocument();
        expect(screen.getByText('Preenchidos')).toBeInTheDocument();

        // Contrato SaaS (false)
        expect(screen.getByText('Contrato SaaS')).toBeInTheDocument();
        expect(screen.getByText('Pendente')).toBeInTheDocument();

        // Mensalidade (true)
        expect(screen.getByText('Mensalidade')).toBeInTheDocument();
        expect(screen.getByText('Ativo')).toBeInTheDocument();

        // Compliance (false)
        expect(screen.getByText('Compliance')).toBeInTheDocument();
        expect(screen.getByText('Em análise')).toBeInTheDocument();
    });

    it('deve chamar onSaveDetails ao submeter o formulário', async () => {
        const onSaveDetails = vi.fn((data) => Promise.resolve(data));
        render(<TestWrapper onSaveDetails={onSaveDetails} />);

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(onSaveDetails).toHaveBeenCalled();
        });
    });

    it('deve exibir estado de loading no botão ao submeter', () => {
        const companyForm = {
            register: vi.fn(),
            handleSubmit: vi.fn(),
            formState: { isSubmitting: true },
        } as any;

        render(
            <DetailsTab
                currentCompany={mockCompany}
                companyForm={companyForm}
                onSaveDetails={vi.fn()}
                ufs={mockUfs}
                cities={mockCities}
                selectedUf="SP"
                statusFlags={mockStatusFlags}
            />
        );
        const button = screen.getByText('Salvar Alterações');
        expect(button).toBeDisabled();
    });
});
