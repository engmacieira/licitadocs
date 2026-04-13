import Select from 'react-select';
import { Building2 } from 'lucide-react';
import type { Company } from '../../../services/companyService';

interface CompanyAutocompleteProps {
    /** Lista completa de empresas carregadas do backend. */
    companies: Company[];
    /** ID da empresa selecionada no momento. */
    value: string;
    /** Callback disparado ao selecionar uma nova empresa. */
    onChange: (id: string) => void;
    /** Estado de carregamento da API. */
    isLoading?: boolean;
}

/**
 * Componente de Autocomplete para seleção de empresas.
 * Permite busca por Razão Social ou CNPJ com feedback visual.
 */
export function CompanyAutocomplete({ companies, value, onChange, isLoading }: CompanyAutocompleteProps) {

    // Mapeia os dados da empresa para o formato do react-select { value, label }
    const options = companies.map(company => ({
        value: company.id,
        label: `${company.razao_social} - ${company.cnpj}`,
        // Facilitamos a busca textual interna permitindo encontrar pelo CNPJ sem formatação também
        searchTerms: `${company.razao_social} ${company.cnpj.replace(/\D/g, '')}`
    }));

    // Encontra a opção selecionada com base no ID passado por prop
    const selectedOption = options.find(opt => opt.value === value) || null;

    return (
        <div className="relative w-full md:w-80">
            {/* Ícone de prédio para manter a consistência com o seletor original */}
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />

            <Select
                options={options}
                value={selectedOption}
                isLoading={isLoading}
                onChange={(option) => onChange(option?.value || "")}
                placeholder="Buscar empresa ou CNPJ..."
                noOptionsMessage={() => "Nenhuma empresa encontrada"}
                isSearchable
                classNamePrefix="company-select"
                // Customização do estilo para bater com o Tailwind do LicitaDocs
                styles={{
                    control: (base) => ({
                        ...base,
                        paddingLeft: '2.2rem', // Espaço para o ícone de prédio
                        borderRadius: '0.5rem',
                        borderColor: '#e2e8f0', // border-slate-200
                        fontSize: '0.875rem',
                        minHeight: '40px',
                        boxShadow: 'none',
                        '&:hover': {
                            borderColor: '#cbd5e1'
                        }
                    }),
                    placeholder: (base) => ({
                        ...base,
                        color: '#94a3b8' // text-slate-400
                    }),
                    input: (base) => ({
                        ...base,
                        color: '#1e293b' // text-slate-800
                    })
                }}
            />
        </div>
    );
}