import { useEffect, useState } from 'react';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { useAuth } from '../../../contexts/AuthContext';

export function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error("Erro ao buscar empresas", error);
            alert("Falha ao carregar lista de clientes.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Admin */}
            <header className="bg-slate-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            LicitaDoc
                        </span>
                        <span className="bg-slate-700 text-xs px-2 py-1 rounded border border-slate-600">
                            Área Operacional
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-300">Olá, {user?.sub}</span>
                        <button
                            onClick={signOut}
                            className="text-sm hover:text-red-400 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Carteira de Clientes</h1>
                        <p className="text-gray-500 mt-1">
                            Gerencie os documentos e a conformidade das empresas parceiras.
                        </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
                        <span>+</span> Nova Empresa
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando carteira...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {company.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 mb-1">
                                    {company.name || company.razao_social || "Empresa sem Nome"}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 font-mono">
                                    CNPJ: {company.cnpj}
                                </p>

                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <button className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group">
                                        Acessar Cofre
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}