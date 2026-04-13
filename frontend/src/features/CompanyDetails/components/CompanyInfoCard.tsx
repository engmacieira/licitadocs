import { Building, UserCircle, Phone, MapPin, Mail, Fingerprint, Map } from 'lucide-react';

/**
 * Propriedades do componente CompanyInfoCard.
 * @interface CompanyInfoCardProps
 */
interface CompanyInfoCardProps {
    /** Dados completos da empresa carregados da API. */
    company: any;
}

/**
 * Componente visual que exibe os dados cadastrais detalhados da empresa.
 * Atualizado para Visão Detalhada [US-2906] incluindo IE, IM e Responsável Legal.
 */
export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
    return (
        <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Building className="h-5 w-5 text-indigo-600" />
                    Ficha Cadastral do Cliente
                </h3>

                <dl className="space-y-5 text-sm">
                    {/* Bloco 1: Identificação Fiscal */}
                    <div className="space-y-3">
                        <div>
                            <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                Nome Fantasia
                            </dt>
                            <dd className="font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                {company.nome_fantasia || 'Não informado'}
                            </dd>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                    I.E. (Estadual)
                                </dt>
                                <dd className="font-medium text-slate-900 px-1">
                                    {company.ie || 'Isento / Não Inf.'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                    I.M. (Municipal)
                                </dt>
                                <dd className="font-medium text-slate-900 px-1">
                                    {company.im || 'Não Inf.'}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    {/* Bloco 2: Responsável Legal */}
                    <div className="space-y-3">
                        <div>
                            <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                <UserCircle className="h-4 w-4" /> Responsável Legal
                            </dt>
                            <dd className="font-medium text-slate-900 px-1">
                                {company.responsavel_nome || 'Nome não informado'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                <Fingerprint className="h-4 w-4" /> CPF do Responsável
                            </dt>
                            <dd className="font-medium text-slate-900 px-1 font-mono text-xs">
                                {company.responsavel_cpf || 'CPF não informado'}
                            </dd>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    {/* Bloco 3: Contatos */}
                    <div className="space-y-3">
                        <div>
                            <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                <Mail className="h-4 w-4" /> E-mail Corporativo
                            </dt>
                            <dd className="font-medium text-slate-900 px-1 break-all">
                                {company.email_corporativo || 'Não informado'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                                <Phone className="h-4 w-4" /> Telefone
                            </dt>
                            <dd className="font-medium text-slate-900 px-1">
                                {company.telefone || 'Não informado'}
                            </dd>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    {/* Bloco 4: Endereço */}
                    <div>
                        <dt className="text-slate-500 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                            <MapPin className="h-4 w-4" /> Endereço Completo
                        </dt>
                        <dd className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-slate-700">
                            <span className="font-medium text-slate-900">
                                {company.logradouro || 'Rua/Av. não informada'}, {company.numero || 'S/N'}
                                {company.complemento && ` - ${company.complemento}`}
                            </span>
                            <br />
                            {company.bairro || 'Bairro não informado'}
                            <br />
                            <span className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200">
                                <Map className="h-3 w-3 text-slate-400" />
                                {company.cidade || 'Cidade'}/{company.estado || 'UF'} — {company.cep || 'CEP'}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}