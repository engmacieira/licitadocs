import { APP_CONFIG, CONTACT_CONFIG } from '../../config/app.config';

/**
 * Página de Política de Privacidade do sistema.
 * Layout focado em leitura, utilizando classes padrão do Tailwind para tipografia.
 */
export function PrivacyPolicy() {
    return (
        <div className="py-16 px-4">
            <article className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">
                    Política de Privacidade
                </h1>

                <div className="space-y-6 text-slate-600 leading-relaxed">
                    <p>
                        A sua privacidade é importante para nós. É política do {APP_CONFIG.name} respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site {APP_CONFIG.name}, e outros sites que possuímos e operamos.
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Coleta de Dados</h2>
                        <p>
                            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Dados de cadastro: Nome, e-mail, CNPJ e telefone.</li>
                            <li>Documentos da empresa: Certidões, contratos e procurações necessários para o serviço.</li>
                            <li>Dados de uso: Informações sobre como você utiliza nossa plataforma para melhorias constantes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Uso das Informações</h2>
                        <p>
                            Utilizamos os dados coletados para fornecer nossos serviços de gestão documental, processar pagamentos, enviar alertas sobre vencimentos de documentos e prestar suporte técnico. Em conformidade com a LGPD, garantimos que o tratamento de dados tem finalidades específicas e legítimas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Retenção e Segurança</h2>
                        <p>
                            Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, os protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Compartilhamento de Dados</h2>
                        <p>
                            Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei ou para a execução dos serviços contratados (ex: processadores de pagamento e integração com órgãos públicos para consulta de certidões).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Seus Direitos (LGPD)</h2>
                        <p>
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, excluir ou portar seus dados pessoais. Você também pode revogar seu consentimento para o tratamento de dados a qualquer momento, o que pode impactar a prestação de nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookies</h2>
                        <p>
                            Utilizamos cookies para melhorar sua experiência de navegação. Você pode optar por desativar os cookies nas configurações do seu navegador, embora isso possa afetar certas funcionalidades do site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contato</h2>
                        <p>
                            Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco pelo e-mail: <span className="font-semibold text-blue-600">{CONTACT_CONFIG.supportEmail}</span>.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-sm text-slate-400">
                    Última atualização: Outubro de 2023
                </div>
            </article>
        </div>
    );
}
