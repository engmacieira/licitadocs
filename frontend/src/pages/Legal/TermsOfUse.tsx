import React from 'react';
import { APP_CONFIG, CONTACT_CONFIG } from '../../config/app.config';
import {
    Handshake,
    Target,
    ShieldAlert,
    AlertTriangle,
    Lightbulb,
    Scale,
    RefreshCw,
    Mail
} from 'lucide-react';

// Componente auxiliar interno para padronizar as seções com Legal Design (UX)
interface TermsSectionProps {
    icon: React.ReactNode;
    title: string;
    summary: string;
    summaryColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'red';
    children: React.ReactNode;
}

function TermsSection({ icon, title, summary, summaryColor, children }: TermsSectionProps) {
    const colorStyles = {
        blue: "bg-blue-50 border-blue-600 text-blue-900",
        emerald: "bg-emerald-50 border-emerald-600 text-emerald-900",
        amber: "bg-amber-50 border-amber-500 text-amber-900",
        purple: "bg-purple-50 border-purple-600 text-purple-900",
        slate: "bg-slate-50 border-slate-500 text-slate-900",
        red: "bg-red-50 border-red-600 text-red-900",
    };

    return (
        <section className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            </div>

            <div className={`border-l-4 p-4 mb-5 rounded-r-md text-sm ${colorStyles[summaryColor]}`}>
                <strong className="block mb-1 font-bold">Resumo Descomplicado:</strong>
                {summary}
            </div>

            <div className="text-slate-600 space-y-4 leading-relaxed">
                {children}
            </div>
        </section>
    );
}

/**
 * Página de Termos de Uso do sistema.
 * Refatorada com foco em Legal Design, UX Writing B2B e Escaneabilidade.
 */
export function TermsOfUse() {
    return (
        <div className="py-16 px-4 bg-white min-h-screen">
            <article className="max-w-3xl mx-auto">
                {/* Header da Página */}
                <header className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-12 pb-8 border-b border-slate-100">
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-sm">
                        <Handshake className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Termos de Uso e Parceria
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Regras claras para uma gestão documental sem dores de cabeça.
                        </p>
                    </div>
                </header>

                {/* Introdução Empática */}
                <div className="mb-12">
                    <p className="text-xl text-slate-700 font-medium leading-relaxed">
                        Bem-vindo ao <strong className="text-slate-900">{APP_CONFIG.name}</strong>. Diferente daqueles termos gigantescos que ninguém lê, escrevemos este documento para que nossa parceria seja transparente. Aqui explicamos exatamente como vamos trabalhar juntos para proteger a regularidade da sua empresa.
                    </p>
                    <p className="mt-4 text-slate-600">
                        Ao acessar e utilizar nossa plataforma, você concorda com as regras abaixo. Se não concordar com algo, não tem problema, mas infelizmente não poderemos prestar nossos serviços.
                    </p>
                </div>

                {/* Corpo das Seções de Termos */}
                <div className="space-y-16">

                    <TermsSection
                        icon={<Target className="h-6 w-6 text-blue-600" />}
                        title="1. O Propósito do Sistema"
                        summary="Nós automatizamos a vigilância das suas certidões. O foco é manter você apto a licitar e receber pagamentos públicos."
                        summaryColor="blue"
                    >
                        <p>
                            O {APP_CONFIG.name} é uma plataforma SaaS B2B destinada à gestão inteligente de documentos e certidões para empresas que participam de processos de licitação e contratos públicos.
                        </p>
                        <p>
                            Nossos serviços incluem o monitoramento contínuo, a organização estruturada e a emissão de alertas precoces sobre a validade de documentos essenciais para a sua regularidade fiscal, trabalhista e técnica.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<ShieldAlert className="h-6 w-6 text-amber-600" />}
                        title="2. Suas Responsabilidades (Segurança)"
                        summary="A regra de ouro: mantenha sua senha segura e os dados do seu CNPJ sempre atualizados. O resto, o sistema monitora."
                        summaryColor="amber"
                    >
                        <p>
                            Para que nossos alertas funcionem perfeitamente, você deve criar uma conta fornecendo informações reais, precisas e completas. O sistema não consegue adivinhar se o seu CNPJ mudou de regime tributário sem que você informe.
                        </p>
                        <p>
                            A segurança da sua senha de acesso é responsabilidade exclusiva sua. Qualquer ação realizada logada na sua conta será atribuída ao titular dela. Além disso, você se compromete a usar a plataforma de forma lícita, respeitando as leis brasileiras vigentes.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
                        title="3. Limites da Nossa Responsabilidade"
                        summary="Transparência total: Nós automatizamos os alertas e buscamos certidões, mas a conferência final e a entrega ao órgão público ainda são responsabilidade da sua equipe."
                        summaryColor="red"
                    >
                        <p>
                            Nós trabalhamos duro para que o {APP_CONFIG.name} esteja 100% disponível e preciso. No entanto, dependemos de sistemas governamentais (Receita Federal, Caixa, Tribunais) que frequentemente saem do ar ou apresentam instabilidades.
                        </p>
                        <p>
                            Por isso, não garantimos que a plataforma estará livre de interrupções causadas por terceiros. Mais importante: <strong>não nos responsabilizamos por multas, faturas retidas ou perdas financeiras</strong> decorrentes de decisões tomadas apenas com base no sistema. A conferência final do acervo e a inserção dos documentos nos portais de licitação cabem inteiramente à sua empresa.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<Scale className="h-6 w-6 text-emerald-600" />}
                        title="4. Boas Práticas e Conduta"
                        summary="Use o sistema para organizar e crescer. Não use para fraudar documentos, realizar ataques ou sobrecarregar nossos servidores."
                        summaryColor="emerald"
                    >
                        <p>
                            É estritamente proibido usar o {APP_CONFIG.name} para fins fraudulentos, para forjar a validade de documentos ou para ações que possam comprometer a integridade da plataforma, dos nossos servidores ou dos dados de outros clientes.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<Lightbulb className="h-6 w-6 text-purple-600" />}
                        title="5. Propriedade Intelectual"
                        summary="O software, o design e o código são nossos. Os documentos e certidões armazenados são seus."
                        summaryColor="purple"
                    >
                        <p>
                            Todo o conteúdo visual, o código-fonte, a inteligência dos alertas, marcas e logotipos associados ao {APP_CONFIG.name} são propriedade exclusiva da nossa empresa e protegidos pelas leis de propriedade intelectual.
                        </p>
                        <p>
                            A reprodução, engenharia reversa ou distribuição não autorizada da nossa plataforma é estritamente proibida e passível de ação judicial.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<RefreshCw className="h-6 w-6 text-slate-600" />}
                        title="6. Evolução destes Termos"
                        summary="O sistema evolui, a lei muda e as regras também. Sempre que algo importante mudar aqui, vamos te avisar."
                        summaryColor="slate"
                    >
                        <p>
                            Reservamo-nos o direito de modificar estes Termos de Uso e Parceria a qualquer momento, para refletir melhorias no sistema ou novas exigências legais.
                        </p>
                        <p>
                            Alterações significativas serão comunicadas através de banners na plataforma ou por e-mail. O seu uso continuado do serviço após essas alterações significa que você aceita os novos termos.
                        </p>
                    </TermsSection>

                    <TermsSection
                        icon={<Mail className="h-6 w-6 text-blue-600" />}
                        title="7. Central de Contato"
                        summary="Leu tudo e ficou com dúvida? A gente te ajuda a entender."
                        summaryColor="blue"
                    >
                        <p>
                            Nossa equipe está sempre disponível para esclarecer como prestamos nosso serviço e como nossos termos afetam o seu negócio. Entre em contato diretamente pelo nosso e-mail de suporte institucional:
                        </p>
                        <p className="mt-4">
                            <a href={`mailto:${CONTACT_CONFIG.supportEmail}`} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg">
                                <Mail className="h-4 w-4" />
                                {CONTACT_CONFIG.supportEmail}
                            </a>
                        </p>
                    </TermsSection>

                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <span>Vigência a partir de: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <span>{APP_CONFIG.name} © Todos os direitos reservados.</span>
                </div>
            </article>
        </div>
    );
}
