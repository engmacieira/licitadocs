import React from 'react';
import { APP_CONFIG, CONTACT_CONFIG } from '../../config/app.config';
import {
    ShieldCheck,
    Database,
    Activity,
    Lock,
    Share2,
    UserCheck,
    Cookie,
    Mail
} from 'lucide-react';

// Componente auxiliar interno para padronizar as seções com Legal Design (UX)
interface PrivacySectionProps {
    icon: React.ReactNode;
    title: string;
    summary: string;
    summaryColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
    children: React.ReactNode;
}

function PrivacySection({ icon, title, summary, summaryColor, children }: PrivacySectionProps) {
    const colorStyles = {
        blue: "bg-blue-50 border-blue-600 text-blue-900",
        emerald: "bg-emerald-50 border-emerald-600 text-emerald-900",
        amber: "bg-amber-50 border-amber-500 text-amber-900",
        purple: "bg-purple-50 border-purple-600 text-purple-900",
        slate: "bg-slate-50 border-slate-500 text-slate-900",
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
                <strong className="block mb-1 font-bold">O que isso significa na prática?</strong>
                {summary}
            </div>

            <div className="text-slate-600 space-y-4 leading-relaxed">
                {children}
            </div>
        </section>
    );
}

/**
 * Página de Política de Privacidade do sistema.
 * Refatorada com foco em Legal Design, UX Writing e Escaneabilidade.
 */
export function PrivacyPolicy() {
    return (
        <div className="py-16 px-4 bg-white min-h-screen">
            <article className="max-w-3xl mx-auto">
                {/* Header da Página - Foco em Autoridade (H1) */}
                <header className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-12 pb-8 border-b border-slate-100">
                    <div className="bg-blue-600 p-4 rounded-2xl shadow-sm">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Política de Privacidade
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Transparência e segurança para proteger o maior ativo da sua empresa.
                        </p>
                    </div>
                </header>

                {/* Introdução Empática - Conectando a dor do cliente (contratos/faturas) à solução */}
                <div className="mb-12">
                    <p className="text-xl text-slate-700 font-medium leading-relaxed">
                        Sabemos que as certidões e os documentos da sua empresa são o seu passaporte para assinar contratos, participar de licitações e garantir o recebimento de faturas. Por isso, a privacidade no <strong className="text-slate-900">{APP_CONFIG.name}</strong> não é apenas um "juridiquês" obrigatório — é o alicerce do nosso serviço.
                    </p>
                </div>

                {/* Corpo das Seções de Privacidade */}
                <div className="space-y-16">

                    <PrivacySection
                        icon={<Database className="h-6 w-6 text-blue-600" />}
                        title="1. Os dados que precisamos (e o motivo)"
                        summary="Não acumulamos dados à toa. Só pedimos o que é estritamente necessário para monitorar a saúde documental do seu CNPJ."
                        summaryColor="blue"
                    >
                        <p>
                            Solicitamos informações pessoais e empresariais apenas quando realmente precisamos delas para prestar nosso serviço de gestão. Fazemos isso de forma justa e legal, sempre com o seu conhecimento e consentimento.
                        </p>
                        <ul className="list-none space-y-3 mt-4">
                            <li className="flex gap-3 items-start">
                                <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                                <span><strong className="text-slate-900">Dados de Cadastro:</strong> Nome, e-mail do responsável, CNPJ e telefone (para alertas urgentes).</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                                <span><strong className="text-slate-900">Documentos da Empresa:</strong> Certidões, contratos e procurações que o sistema precisa monitorar.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                                <span><strong className="text-slate-900">Dados de Uso:</strong> Estatísticas anônimas de como você navega na plataforma, para continuarmos melhorando a interface.</span>
                            </li>
                        </ul>
                    </PrivacySection>

                    <PrivacySection
                        icon={<Activity className="h-6 w-6 text-emerald-600" />}
                        title="2. Como usamos as suas informações"
                        summary="Seus dados trabalham a seu favor: eles alimentam nossos robôs para cruzar informações e emitir alertas de vencimento."
                        summaryColor="emerald"
                    >
                        <p>
                            Utilizamos os dados coletados com um único grande objetivo: fornecer um serviço de excelência. Isso inclui processar pagamentos, realizar integrações com bases governamentais e, principalmente, disparar alertas antecipados para que sua empresa não fique irregular.
                        </p>
                        <p>
                            Em total conformidade com a LGPD, garantimos que o tratamento de dados possui finalidades específicas, legítimas e ligadas à execução do seu contrato conosco.
                        </p>
                    </PrivacySection>

                    <PrivacySection
                        icon={<Lock className="h-6 w-6 text-amber-600" />}
                        title="3. Segurança e Tempo de Retenção"
                        summary="Guardamos seus documentos como um cofre digital e os descartamos assim que não forem mais úteis para a prestação do serviço."
                        summaryColor="amber"
                    >
                        <p>
                            Apenas retemos as informações pelo tempo necessário para cumprir com o serviço solicitado ou exigências legais.
                        </p>
                        <p>
                            Para proteger seu acervo, utilizamos criptografia e medidas de segurança comercialmente aceitas. Nosso objetivo é blindar sua conta contra perdas, roubos, acessos não autorizados ou vazamentos.
                        </p>
                    </PrivacySection>

                    <PrivacySection
                        icon={<Share2 className="h-6 w-6 text-purple-600" />}
                        title="4. Compartilhamento Restrito"
                        summary="Nós não vendemos listas de clientes. Seus dados só saem da nossa base para órgãos oficiais ou serviços de infraestrutura técnica."
                        summaryColor="purple"
                    >
                        <p>
                            Não compartilhamos suas informações de identificação publicamente nem as comercializamos com terceiros.
                        </p>
                        <p>
                            As únicas exceções ocorrem para a execução do próprio serviço (exemplo: enviar uma requisição para a Receita Federal para baixar sua Certidão Negativa, ou repassar os dados de cobrança para nosso gateway de pagamentos) ou por determinação judicial.
                        </p>
                    </PrivacySection>

                    <PrivacySection
                        icon={<UserCheck className="h-6 w-6 text-blue-600" />}
                        title="5. Seus Direitos (LGPD)"
                        summary="Você é o dono dos seus dados. Pode visualizar, corrigir ou solicitar a exclusão de tudo com poucos cliques."
                        summaryColor="blue"
                    >
                        <p>
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem total controle sobre suas informações. Tem o direito de acessar, corrigir dados desatualizados, baixar seu acervo (portabilidade) ou exigir a exclusão completa.
                        </p>
                        <p>
                            Vale lembrar: caso você revogue o consentimento para o tratamento de dados essenciais, o {APP_CONFIG.name} poderá ser impedido de continuar monitorando suas certidões.
                        </p>
                    </PrivacySection>

                    <PrivacySection
                        icon={<Cookie className="h-6 w-6 text-slate-600" />}
                        title="6. Uso de Cookies"
                        summary="Usamos pequenos arquivos de texto para lembrar do seu login e manter sua sessão segura enquanto trabalha."
                        summaryColor="slate"
                    >
                        <p>
                            Utilizamos cookies estritamente para manter a plataforma funcionando corretamente, proteger seu acesso (sessão) e entender de forma anônima os padrões de acesso para corrigir gargalos no sistema.
                        </p>
                        <p>
                            Você pode desativar os cookies no seu navegador a qualquer momento, mas isso pode impactar a sua capacidade de fazer login e gerenciar os documentos.
                        </p>
                    </PrivacySection>

                    <PrivacySection
                        icon={<Mail className="h-6 w-6 text-slate-600" />}
                        title="7. Fale com o nosso DPO"
                        summary="Viu algo estranho ou tem dúvidas? Nossa equipe técnica e jurídica está à disposição."
                        summaryColor="slate"
                    >
                        <p>
                            A transparência é inegociável para nós. Se você, como titular dos dados, tiver qualquer dúvida sobre as práticas adotadas nesta política ou quiser exercer seus direitos, não hesite em nos chamar.
                        </p>
                        <p className="mt-4">
                            Envie um e-mail direto para nossa equipe de privacidade em:{' '}
                            <a href={`mailto:${CONTACT_CONFIG.supportEmail}`} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                {CONTACT_CONFIG.supportEmail}
                            </a>
                        </p>
                    </PrivacySection>

                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <span>Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <span>{APP_CONFIG.name} © Todos os direitos reservados.</span>
                </div>
            </article>
        </div>
    );
}