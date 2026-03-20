import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente CompanyHeader.
 * @interface CompanyHeaderProps
 */
interface CompanyHeaderProps {
    /** Dados completos da empresa carregados da API. */
    company: any;
    /** Função acionada ao clicar no botão de aprovar empresa. */
    onApprove: () => void;
    /** Estado de carregamento do botão de aprovação. */
    approving: boolean;
}

/**
 * Componente visual que exibe o cabeçalho da página de detalhes.
 * Mostra a identificação visual da empresa, dados principais (CNPJ, E-mail)
 * e os controlos de Compliance (Aprovar Documentação).
 */
export function CompanyHeader({ company, onApprove, approving }: CompanyHeaderProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
                    {(company.razao_social || company.name || '?')[0].toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{company.razao_social || company.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-sm">
                            <Building2 size={14} /> {company.cnpj}
                        </span>
                        <span className="hidden sm:block h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-sm">{company.email_corporativo || "Sem e-mail cadastrado"}</span>
                    </div>
                </div>
            </div>

            {/* Botão de Ação Principal (Compliance) */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                {company.is_admin_verified ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium">
                        <CheckCircle2 size={20} />
                        Empresa Verificada
                    </div>
                ) : (
                    <Button
                        onClick={onApprove}
                        isLoading={approving}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                        <ShieldCheck className="mr-2 h-5 w-5" />
                        Aprovar Documentação
                    </Button>
                )}
                <p className="text-xs text-slate-400">
                    Status do Contrato: {company.is_contract_signed ? 'Assinado ✅' : 'Pendente ❌'}
                </p>
            </div>
        </div>
    );
}