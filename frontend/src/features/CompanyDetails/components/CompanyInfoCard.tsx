/**
 * Propriedades do componente CompanyInfoCard.
 * @interface CompanyInfoCardProps
 */
interface CompanyInfoCardProps {
    /** Dados completos da empresa carregados da API. */
    company: any;
}

/**
 * Componente visual que exibe os dados cadastrais detalhados da empresa
 * (Responsável, Telefone, Endereço e Nome Fantasia).
 */
export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
    return (
        <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                    Dados do Cliente
                </h3>
                <dl className="space-y-4 text-sm">
                    <div>
                        <dt className="text-slate-500 mb-0.5">Nome Fantasia</dt>
                        <dd className="font-medium text-slate-900">{company.nome_fantasia || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-500 mb-0.5">Responsável Legal</dt>
                        <dd className="font-medium text-slate-900">{company.responsavel_nome || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-500 mb-0.5">Telefone de Contacto</dt>
                        <dd className="font-medium text-slate-900">{company.telefone || '-'}</dd>
                    </div>
                    <div className="pt-2">
                        <dt className="text-slate-500 mb-0.5">Endereço Completo</dt>
                        <dd className="font-medium text-slate-900 leading-relaxed">
                            {company.logradouro}, {company.numero}<br />
                            {company.bairro} - {company.cidade}/{company.estado}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}