import { APP_CONFIG, CONTACT_CONFIG } from '../../config/app.config';

/**
 * Página de Termos de Uso do sistema.
 * Layout focado em leitura, utilizando classes padrão do Tailwind para tipografia.
 */
export function TermsOfUse() {
    return (
        <div className="py-16 px-4">
            <article className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">
                    Termos de Uso
                </h1>

                <div className="space-y-6 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e utilizar a plataforma {APP_CONFIG.name}, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Descrição do Serviço</h2>
                        <p>
                            O {APP_CONFIG.name} é uma plataforma SaaS B2B destinada à gestão de documentos e certidões para empresas que participam de processos de licitação e contratos públicos. Nossos serviços incluem o monitoramento, organização e alerta sobre a validade de documentos essenciais para a regularidade fiscal e técnica.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Cadastro e Segurança</h2>
                        <p>
                            Para utilizar as funcionalidades do {APP_CONFIG.name}, o usuário deve criar uma conta fornecendo informações precisas e completas. A segurança da senha de acesso é de responsabilidade exclusiva do usuário. Qualquer atividade realizada na conta será atribuída ao titular da mesma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Responsabilidades do Usuário</h2>
                        <p>
                            O usuário compromete-se a utilizar a plataforma de forma lícita, respeitando a legislação brasileira vigente. É proibido o uso do sistema para fins fraudulentos ou que possam comprometer a integridade da plataforma e dos dados de terceiros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo, marcas, logotipos e software associados ao {APP_CONFIG.name} são de propriedade exclusiva da nossa empresa e protegidos pelas leis de propriedade intelectual. A reprodução ou distribuição não autorizada é estritamente proibida.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitação de Responsabilidade</h2>
                        <p>
                            Embora o {APP_CONFIG.name} se esforce para manter a precisão e disponibilidade do serviço, não garantimos que a plataforma estará livre de erros ou interrupções. Não nos responsabilizamos por perdas decorrentes de decisões tomadas com base nas informações fornecidas pelo sistema, sendo a conferência final dos documentos de responsabilidade do usuário.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Alterações nos Termos</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas aos usuários através da plataforma ou por e-mail. O uso continuado do serviço após tais alterações constitui aceitação dos novos termos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contato</h2>
                        <p>
                            Em caso de dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: <span className="font-semibold text-blue-600">{CONTACT_CONFIG.supportEmail}</span>.
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
