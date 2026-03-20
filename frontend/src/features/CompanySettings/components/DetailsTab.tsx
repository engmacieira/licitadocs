import { Building2, ShieldCheck, CheckCircle2, XCircle, Save, FileText } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CompanyFormSchema } from '../CompanySettingsOrchestrator';

/**
 * Propriedades do componente DetailsTab.
 * @interface DetailsTabProps
 */
interface DetailsTabProps {
    currentCompany: any;
    companyForm: UseFormReturn<CompanyFormSchema>;
    onSaveDetails: (data: CompanyFormSchema) => void;
    ufs: { sigla: string; nome: string }[];
    cities: { nome: string }[];
    selectedUf: string;
    statusFlags: { data: boolean; contract: boolean; payment: boolean; approval: boolean };
}

/**
 * Componente visual que exibe o formulário de dados cadastrais da empresa
 * com integração aos selects de Estado e Município do IBGE.
 * Inclui o painel lateral com o progresso do Onboarding.
 */
export function DetailsTab({ currentCompany, companyForm, onSaveDetails, ufs, cities, selectedUf, statusFlags }: DetailsTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Informações Gerais</h3>
                    <form onSubmit={companyForm.handleSubmit(onSaveDetails)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="opacity-75 cursor-not-allowed">
                                <Input label="CNPJ (Imutável)" value={currentCompany.cnpj} disabled className="bg-slate-100" />
                            </div>
                            <Input label="Razão Social" {...companyForm.register("razao_social")} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id="nome_fantasia" label="Nome Fantasia" {...companyForm.register("nome_fantasia")} />
                            <Input label="E-mail Corporativo" type="email" {...companyForm.register("email_corporativo")} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Responsável Legal" {...companyForm.register("responsavel_nome")} />
                            <Input label="Telefone / WhatsApp" {...companyForm.register("telefone")} />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 pt-4 mb-2 border-b pb-2">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="CEP" {...companyForm.register("cep")} />
                            <div className="md:col-span-2">
                                <Input label="Logradouro" {...companyForm.register("logradouro")} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Input label="Número" {...companyForm.register("numero")} />
                            <div className="md:col-span-2">
                                <Input label="Bairro" {...companyForm.register("bairro")} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">Estado</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                    {...companyForm.register("estado")}
                                >
                                    <option value="">UF</option>
                                    {ufs.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">Cidade</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                                    {...companyForm.register("cidade")}
                                    disabled={!selectedUf || cities.length === 0}
                                >
                                    <option value="">Selecione...</option>
                                    {cities.map(city => <option key={city.nome} value={city.nome}>{city.nome}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <Button type="submit" isLoading={companyForm.formState.isSubmitting} className="w-full md:w-auto">
                                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Cartão Lateral de Status */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" /> Situação Cadastral
                    </h3>
                    <div className="space-y-4">
                        <StatusItem label="Dados da Empresa" status={statusFlags.data} icon={Building2} textTrue="Preenchidos" textFalse="Pendentes" />
                        <StatusItem label="Contrato SaaS" status={statusFlags.contract} icon={FileText} textTrue="Assinado" textFalse="Pendente" />
                        <StatusItem label="Mensalidade" status={statusFlags.payment} icon={CheckCircle2} textTrue="Ativo" textFalse="Pendente" />
                        <StatusItem label="Compliance" status={statusFlags.approval} icon={ShieldCheck} textTrue="Aprovado" textFalse="Em análise" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, status, icon: Icon, textTrue, textFalse }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${status ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">{status ? textTrue : textFalse}</p>
                </div>
            </div>
            {status ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-amber-500 h-5 w-5" />}
        </div>
    );
}