import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, MoreHorizontal, Building2,
    CheckCircle2, XCircle, AlertCircle, FileText, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

// Serviços
import { companyService } from '../../../services/companyService'; // Certifique-se que Company tem as flags novas
import type { Company } from '../../../services/companyService';

// Componentes UI
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';

export function AdminCompaniesPage() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<any[]>([]); // Usando any por segurança das flags novas
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'regular'>('all');

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        setLoading(true);
        try {
            // Chama a rota GET /companies que corrigimos
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar lista de empresas.");
        } finally {
            setLoading(false);
        }
    }

    // Lógica de Filtragem
    const filteredCompanies = companies.filter(company => {
        const matchesSearch =
            (company.razao_social || company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (company.cnpj || '').includes(searchTerm);

        const isRegular = company.is_contract_signed && company.is_payment_active && company.is_admin_verified;

        let matchesFilter = true;
        if (filter === 'regular') matchesFilter = isRegular;
        if (filter === 'pending') matchesFilter = !isRegular;

        return matchesSearch && matchesFilter;
    });

    // Helper para Status Badge
    const renderStatusBadge = (company: any) => {
        // 1. Compliance (Admin Verified)
        if (!company.is_admin_verified) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    <ShieldCheck className="w-3 h-3" /> Validar Docs
                </span>
            );
        }
        // 2. Pagamento
        if (!company.is_payment_active) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3" /> Pagamento
                </span>
            );
        }
        // 3. Regular
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle2 className="w-3 h-3" /> Regular
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por Razão Social ou CNPJ..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todas" />
                    <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Com Pendências" />
                    <FilterButton active={filter === 'regular'} onClick={() => setFilter('regular')} label="Regulares" />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p>Nenhuma empresa encontrada com os filtros atuais.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Etapas</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status Final</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                                    {(company.razao_social || company.name || '?')[0].toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{company.razao_social || company.name}</div>
                                                    <div className="text-xs text-slate-500">{company.email_corporativo || "Sem e-mail"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                            {company.cnpj}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <StepDot done={company.is_contract_signed} title="Contrato" />
                                                <StepDot done={company.is_payment_active} title="Pagamento" />
                                                <StepDot done={company.is_admin_verified} title="Validação Admin" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(company)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/admin/companies/${company.id}`)}
                                                className="text-slate-400 hover:text-blue-600"
                                            >
                                                Gerenciar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-componentes
function FilterButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
        >
            {label}
        </button>
    );
}

function StepDot({ done, title }: { done: boolean, title: string }) {
    return (
        <div
            className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : 'bg-slate-200'}`}
            title={`${title}: ${done ? 'Concluído' : 'Pendente'}`}
        />
    );
}