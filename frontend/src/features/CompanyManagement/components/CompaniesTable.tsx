import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

/**
 * Propriedades do componente CompaniesTable.
 * @interface CompaniesTableProps
 */
interface CompaniesTableProps {
    /** Lista de empresas já filtradas pelo Orquestrador. */
    companies: any[];
    /** Indica se os dados ainda estão a ser carregados da API. */
    loading: boolean;
}

/**
 * Componente visual responsável por renderizar a tabela com a carteira de clientes.
 * Exibe o progresso do onboarding (steps) e os badges de status de cada empresa,
 * fornecendo também a ação para gerir a empresa selecionada.
 */
export function CompaniesTable({ companies, loading }: CompaniesTableProps) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset pagination when companies list changes (e.g., after filter)
    useEffect(() => {
        setCurrentPage(1);
    }, [companies.length]);

    const totalPages = Math.ceil(companies.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCompanies = companies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    /**
     * Função auxiliar que determina a cor e o ícone do badge de status 
     * baseando-se no progresso do cliente no sistema.
     */
    const renderStatusBadge = (company: any) => {
        // ... (existing logic)
        if (!company.is_admin_verified) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    <ShieldCheck className="w-3 h-3" /> Validar Docs
                </span>
            );
        }
        if (!company.is_payment_active) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3" /> Pagamento
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle2 className="w-3 h-3" /> Regular
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {loading ? (
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
            ) : companies.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>Nenhuma empresa encontrada com os filtros atuais.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto custom-scrollbar">
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
                                {paginatedCompanies.map((company) => (
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

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <div className="text-sm text-slate-500">
                                Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, companies.length)}</span> de <span className="font-medium">{companies.length}</span> empresas
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="bg-white"
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="bg-white"
                                >
                                    Próximo
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Subcomponente auxiliar interno para renderizar as "bolinhas" indicadoras de progresso 
 * do Onboarding da empresa.
 */
function StepDot({ done, title }: { done: boolean, title: string }) {
    return (
        <div
            className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : 'bg-slate-200'}`}
            title={`${title}: ${done ? 'Concluído' : 'Pendente'}`}
        />
    );
}