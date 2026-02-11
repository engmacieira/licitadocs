import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Button } from '../../../components/ui/Button';
import { Plus, Building2, Search, Pencil, Trash2, Power, Eye } from 'lucide-react'; // Adicionei Power
import { Skeleton } from '../../../components/ui/Skeleton';
import { CreateCompanyModal } from './CreateCompanyModal';
import { toast } from 'sonner';

export function CompaniesPage() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
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

    // Alternar Status
    async function handleToggleStatus(company: Company) {
        try {
            // Atualização Otimista (Muda na tela antes de confirmar no servidor para ser rápido)
            const newStatus = !company.is_active;
            setCompanies(prev => prev.map(c =>
                c.id === company.id ? { ...c, is_active: newStatus } : c
            ));

            await companyService.toggleStatus(company.id);

            const action = newStatus ? "ativado" : "bloqueado";
            toast.success(`Acesso de ${company.razao_social || company.name} ${action}!`);

        } catch (error) {
            toast.error("Erro ao alterar status. Desfazendo...");
            loadData(); // Recarrega os dados reais em caso de erro
        }
    }

    async function handleDelete(company: Company) {
        if (!window.confirm(`Tem certeza que deseja excluir "${company.razao_social || company.name}"?`)) return;

        try {
            await companyService.delete(company.id);
            toast.success("Empresa removida com sucesso.");
            loadData();
        } catch (error) {
            toast.error("Erro ao excluir empresa.");
        }
    }

    function handleEdit(company: Company) {
        setEditingCompany(company);
        setIsModalOpen(true);
    }

    function handleCreate() {
        setEditingCompany(null);
        setIsModalOpen(true);
    }

    // Filtro de busca (Case insensitive)
    const filteredCompanies = companies.filter(c => {
        const search = searchTerm.toLowerCase();
        return (
            (c.razao_social && c.razao_social.toLowerCase().includes(search)) ||
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.cnpj && c.cnpj.includes(search))
        );
    });

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Empresas</h1>
                    <p className="text-slate-500">Administre seus clientes e contratos.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Empresa
                </Button>
            </div>

            {/* Filtros e Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Barra de Busca */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4">CNPJ</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCompanies.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Nenhuma empresa encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <tr key={company.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {company.razao_social || company.name}
                                                        </div>
                                                        {company.nome_fantasia && (
                                                            <div className="text-xs text-slate-500">{company.nome_fantasia}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {company.cnpj}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {company.is_active ? 'Ativo' : 'Bloqueado'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* 1. Botão Ativar/Bloquear */}
                                                    <button
                                                        onClick={() => handleToggleStatus(company)}
                                                        className={`p-2 rounded-lg transition-colors ${company.is_active
                                                                ? 'text-green-600 hover:bg-green-50'
                                                                : 'text-slate-400 hover:bg-slate-100'
                                                            }`}
                                                        title={company.is_active ? "Clique para Bloquear" : "Clique para Ativar"}
                                                    >
                                                        <Power size={18} />
                                                    </button>

                                                    {/* 2. Botão Ver Detalhes */}
                                                    <button
                                                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {/* 3. Botão Editar */}
                                                    <button
                                                        onClick={() => handleEdit(company)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    {/* 4. Botão Excluir */}
                                                    <button
                                                        onClick={() => handleDelete(company)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Criação/Edição */}
            <CreateCompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
                companyToEdit={editingCompany}
            />
        </div>
    );
}