import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Serviços
import { companyService } from '../../services/companyService';

// Componentes UI Puros
import { Button } from '../../components/ui/Button';

// Subcomponentes da Feature
import { FilterBar } from './components/FilterBar';
import { CompaniesTable } from './components/CompaniesTable';

/**
 * Orquestrador da Gestão de Empresas (Carteira de Clientes).
 * Gere a busca de dados na API, o estado dos filtros (texto e abas) 
 * e aplica a lógica de pesquisa em tempo real antes de enviar os dados
 * para a tabela visual.
 */
export function CompaniesOrchestrator() {
    const navigate = useNavigate();

    // --- ESTADOS DE DADOS ---
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE FILTRO ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'regular'>('all');

    /**
     * Carrega a lista completa de empresas cadastradas no sistema.
     */
    useEffect(() => {
        async function loadCompanies() {
            setLoading(true);
            try {
                const data = await companyService.getAll();
                setCompanies(data);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar lista de empresas.");
            } finally {
                setLoading(false);
            }
        }
        loadCompanies();
    }, []);

    /**
     * Aplica os filtros de pesquisa e status de forma reativa e otimizada (useMemo).
     * Uma empresa é considerada 'regular' se cumpriu os 3 passos do onboarding:
     * Contrato Assinado, Pagamento Ativo e Validação Admin.
     */
    const filteredCompanies = useMemo(() => {
        return companies.filter(company => {
            // Filtro de Texto (Busca por Razão Social, Nome ou CNPJ)
            const matchesSearch =
                (company.razao_social || company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (company.cnpj || '').includes(searchTerm);

            // Filtro de Status (Regra de Negócio)
            const isRegular = company.is_contract_signed && company.is_payment_active && company.is_admin_verified;

            let matchesFilter = true;
            if (filter === 'regular') matchesFilter = isRegular;
            if (filter === 'pending') matchesFilter = !isRegular;

            return matchesSearch && matchesFilter;
        });
    }, [companies, searchTerm, filter]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Carteira de Clientes</h1>
                    <p className="text-sm text-slate-500">
                        Gerencie as {companies.length} empresas cadastradas na plataforma.
                    </p>
                </div>
                <Button onClick={() => navigate('/register')}>
                    <Building2 className="mr-2 h-4 w-4" /> Nova Empresa
                </Button>
            </div>

            {/* Barra de Pesquisa e Filtros Isolada */}
            <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filter={filter}
                setFilter={setFilter}
            />

            {/* Tabela de Empresas Isolada */}
            <CompaniesTable
                companies={filteredCompanies}
                loading={loading}
            />

        </div>
    );
}