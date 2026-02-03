import { useEffect, useState } from 'react';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Button } from '../../../components/ui/Button';
import { Plus, Building2, Search, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CreateCompanyModal } from './CreateCompanyModal';
import { toast } from 'sonner';

export function CompaniesPage() {
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
            // await new Promise(resolve => setTimeout(resolve, 500)); // Delay para teste visual
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar lista de empresas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(company: Company) {
        // Confirmação nativa (simples e funcional)
        if (!window.confirm(`Tem certeza que deseja excluir "${company.name}"?`)) return;

        try {
            await companyService.delete(company.id);
            toast.success("Empresa removida com sucesso.");
            loadData(); // Recarrega
        } catch (error) {
            toast.error("Erro ao excluir empresa. Verifique se há documentos vinculados.");
        }
    }

    function handleOpenCreate() {
        setEditingCompany(null);
        setIsModalOpen(true);
    }

    function handleOpenEdit(company: Company) {
        setEditingCompany(company);
        setIsModalOpen(true);
    }

    // Lógica de Filtragem Local
    const filteredCompanies = companies.filter(c =>
        (c.name || c.razao_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cnpj || '').includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestão de Empresas</h1>
                    <p className="text-slate-500">Administre os clientes e seus acessos.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2" size={18} />
                    Nova Empresa
                </Button>
            </div>

            {/* Barra de Ferramentas */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="text-sm text-slate-500 ml-auto">
                    Total: <strong>{filteredCompanies.length}</strong> empresas
                </div>
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    // Skeleton Loading
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3 w-1/3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-32 hidden md:block" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    // Empty State
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Building2 size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhuma empresa encontrada</h3>
                        <p className="text-slate-500 mt-1">
                            {searchTerm ? `Não encontramos nada para "${searchTerm}"` : "Cadastre sua primeira empresa para começar."}
                        </p>
                    </div>
                ) : (
                    // Tabela Real
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4 hidden md:table-cell">CNPJ</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${company.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{company.name || company.razao_social}</p>
                                                    <p className="text-xs text-slate-400 md:hidden">{company.cnpj}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600 hidden md:table-cell">
                                            {company.cnpj}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${company.is_active
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {company.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(company)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
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
                                ))}
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