import { useState, useMemo } from 'react';
import type { EmissionRuleDTO } from '../../../../services/emissionRuleService';

interface CompanySelectorProps {
    companies: any[];
    selectedCompanyId: string;
    setSelectedCompanyId: (id: string) => void;
    rule: EmissionRuleDTO;
}

export function CompanySelector({ companies, selectedCompanyId, setSelectedCompanyId, rule }: CompanySelectorProps) {
    const [showAll, setShowAll] = useState(false);

    // MÁGICA: Filtra as empresas baseadas na cidade e estado da Regra
    const filteredCompanies = useMemo(() => {
        if (showAll || !rule) return companies;

        return companies.filter(company => {
            // Prevenção contra undefined na Empresa
            const companyCity = company.cidade || company.city || "";
            const companyState = company.estado || company.state || "";

            // Prevenção contra undefined na Regra (A MÁGICA AQUI)
            const ruleCity = rule.city || "";
            const ruleState = rule.state || "";

            // Comparamos ignorando maiúsculas e minúsculas
            return companyCity.trim().toLowerCase() === ruleCity.trim().toLowerCase() &&
                companyState.trim().toLowerCase() === ruleState.trim().toLowerCase();
        });
    }, [companies, rule, showAll]);

    return (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 lg:w-96 flex-shrink-0 shadow-inner">
            <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">
                    Empresa Solicitante
                </label>
                {/* Válvula de Escape: Caso o cadastro da empresa esteja desatualizado */}
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer hover:text-blue-600 transition-colors">
                    <input
                        type="checkbox"
                        checked={showAll}
                        onChange={(e) => setShowAll(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Mostrar todas
                </label>
            </div>

            <select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            >
                <option value="">-- Selecione uma empresa --</option>
                {filteredCompanies.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.razao_social || c.name} ({c.cnpj})
                    </option>
                ))}
            </select>

            {/* Aviso visual caso o filtro retorne vazio */}
            {!showAll && filteredCompanies.length === 0 && (
                <div className="mt-2 text-[10px] text-amber-700 bg-amber-100/50 p-1.5 rounded border border-amber-200/50 leading-tight">
                    Nenhuma empresa com endereço registado em <strong>{rule.city}/{rule.state}</strong>. Marque "Mostrar todas" para ver a lista completa.
                </div>
            )}
        </div>
    );
}