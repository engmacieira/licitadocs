import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Building2, Users, Activity, Plus, UploadCloud, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Componentes UI
import { StatsCard } from '../../../components/ui/StatsCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Pequeno delay para exibir o Skeleton (sensação de processamento)
            // await new Promise(resolve => setTimeout(resolve, 600)); 
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados do painel.");
        } finally {
            setLoading(false);
        }
    }

    // Cálculos Simples para o Dashboard
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.is_active).length;
    const inactiveCompanies = totalCompanies - activeCompanies;

    return (
        <div className="space-y-8">
            {/* 1. Cabeçalho da Página (Título + Ações) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
                    <p className="text-slate-500">Acompanhe métricas e gerencie seus clientes.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/upload')}
                    >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Rápido
                    </Button>
                    <Button
                        onClick={() => navigate('/admin/companies')}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Empresa
                    </Button>
                </div>
            </div>

            {/* 2. Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total de Clientes"
                    value={loading ? "..." : totalCompanies}
                    icon={Building2}
                    color="blue"
                    loading={loading}
                    description="Empresas cadastradas na base"
                />
                <StatsCard
                    title="Contratos Ativos"
                    value={loading ? "..." : activeCompanies}
                    icon={Activity}
                    color="green"
                    loading={loading}
                    trend="up"
                    description="Clientes operando normalmente"
                />
                <StatsCard
                    title="Inativos / Pendentes"
                    value={loading ? "..." : inactiveCompanies}
                    icon={Users}
                    color="amber"
                    loading={loading}
                    trend={inactiveCompanies > 0 ? 'down' : 'neutral'}
                    description="Requer atenção do admin"
                />
            </div>

            {/* 3. Seção de Clientes Recentes (Preview) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Carteira de Clientes</h2>
                    <Link
                        to="/admin/companies"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center hover:underline"
                    >
                        Ver todos <ArrowRight size={16} className="ml-1" />
                    </Link>
                </div>

                {loading ? (
                    // Grid de Skeletons
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-32 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Grid de Empresas
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companies.slice(0, 6).map((company) => (
                            <div
                                key={company.id}
                                className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
                                onClick={() => navigate('/admin/companies')} // Futuramente pode ir para detalhes da empresa
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-lg ${company.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <Building2 size={20} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${company.is_active
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {company.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                    {company.razao_social || company.name}
                                </h3>
                                <p className="text-sm text-slate-500 font-mono mt-1">
                                    {company.cnpj}
                                </p>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-slate-400 gap-1">
                                    <Activity size={12} />
                                    <span>Última atualização recente</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}