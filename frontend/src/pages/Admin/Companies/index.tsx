import { useEffect, useState } from 'react';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Button } from '../../../components/ui/Button';
import { Plus, Building2, Search, Pencil, Trash2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { CreateCompanyModal } from './CreateCompanyModal';

export function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error("❌ Erro ao buscar empresas:", error);
            alert("Erro ao carregar lista de empresas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(company: Company) {
        // Confirmação nativa do browser (simples e eficaz)
        const confirm = window.confirm(`Tem certeza que deseja excluir a empresa "${company.name}"? Essa ação não pode ser desfeita.`);

        if (confirm) {
            try {
                // Chama o serviço
                await companyService.delete(company.id);
                alert("Empresa excluída com sucesso.");
                // Recarrega a lista
                loadData();
            } catch (error) {
                console.error("Erro ao excluir:", error);
                alert("Erro ao excluir empresa.");
            }
        }
    }

    // Filtragem simples no frontend
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj.includes(searchTerm)
    );

    // Função auxiliar para abrir o modal de criação (limpo)
    function handleNew() {
        setEditingCompany(null);
        setIsModalOpen(true);
    }

    // Função auxiliar para abrir o modal de edição (preenchido)
    function handleEdit(company: Company) {
        setEditingCompany(company);
        setIsModalOpen(true);
    }

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Gestão de Empresas
                    </h1>
                    <p className="text-slate-500 text-sm">Gerencie os clientes e seus acessos.</p>
                </div>

                {/* 🎯 Ação de Abrir o Modal */}
                <Button onClick={handleNew}>
                    <Plus className="mr-2" size={18} />
                    Nova Empresa
                </Button>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Buscar por Razão Social ou CNPJ..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Carregando empresas...</div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Building2 size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhuma empresa encontrada</h3>
                        <p className="text-slate-500">Cadastre a primeira empresa para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Razão Social</th>
                                <th className="px-6 py-4">CNPJ</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCompanies.map(company => (
                                <tr key={company.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {company.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {company.cnpj}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${company.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'}`}>
                                            {company.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    {/* 🎯 AÇÃO DE EDITAR */}
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(company)}
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                                            title="Editar Empresa"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {/* 🎯 NOVO BOTÃO DE EXCLUIR */}
                                        <button
                                            onClick={() => handleDelete(company)}
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                            title="Excluir Empresa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* 🎯 Renderização do Modal */}
            <CreateCompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadData(); // Recarrega a tabela ao salvar
                }}
                companyToEdit={editingCompany}
            />
        </div>
    );
}