import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    FileCheck,
    Scale,
    Anchor,
    Map,
    Handshake,
    MessageSquare,
    Target,
    ArrowRight,
    LayoutDashboard, // Ícone para Simplicidade
    Award,
    CheckCircle2
} from 'lucide-react';

// Nossos Componentes UI
import { Button } from '../../components/ui/Button';

import { ScrollToTop } from '../../components/ui/ScrollToTop';

/**
 * Página institucional "Sobre Nós" (About).
 * * ESTRATÉGIA DE UX & COPY:
 * - Seção 1 (A Origem): Foco na história real e no problema identificado.
 * - Seção 2 (A Bagagem): Destaque absoluto para os 10+ anos de experiência (Gatilho de Autoridade).
 * - Seção 3 (Visão e Missão): O objetivo de democratizar o acesso e proteger a empresa.
 * - Seção 4 (DNA/Valores): Grid expandido com 6 pilares, incluindo a nova "Simplicidade e Organização".
 */
export function AboutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <ScrollToTop />
            {/* --- HEADER --- */}
            <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                        aria-label="Voltar para a página inicial"
                    >
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            Licita<span className="text-blue-600">Docs</span>
                        </span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                        Entrar
                    </Button>
                </div>
            </header>

            <main className="flex-1">

                {/* --- HERO INSTITUCIONAL (QUEM SOMOS) --- */}
                <section className="pt-24 pb-16 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <span className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">
                            A Nossa Origem
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            10 anos julgando licitações. <br />
                            <span className="text-blue-600">Agora, trabalhando a seu favor.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
                            O LicitaDocs não é um software genérico criado por aventureiros. Ele nasceu do incômodo diário de quem passou mais de uma década do outro lado do balcão, no coração do setor de compras públicas.
                        </p>
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 max-w-3xl mx-auto text-left relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-2xl"></div>
                            <p className="text-slate-700 leading-relaxed font-medium">
                                "Por anos, atuei como Pregoeiro Oficial, Presidente de Comissão e Chefe de Compras. Vi a transição da Lei 8.666/93 para a 14.133/21. E sabe o que nunca mudou? A dor de desclassificar empresas excelentes, com preços ótimos, por puro descuido em um documento. Decidi que era hora de mudar de lado e acabar com isso."
                            </p>
                        </div>
                    </div>
                    {/* Elementos decorativos */}
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl opacity-50" />
                    <div className="absolute top-10 -left-10 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl opacity-50" />
                </section>

                {/* --- A BAGAGEM DA EQUIPE (NOVA SEÇÃO DE AUTORIDADE) --- */}
                <section className="py-20 bg-white border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-slate-900">Nós sabemos exatamente o que o pregoeiro está procurando.</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    A nossa equipe passou por todas as camadas do processo licitatório. Desde a base, emitindo ordens de serviço e recebendo notas fiscais, até a elaboração de minutas e aditivos no setor de contratos.
                                </p>
                                <ul className="space-y-4 mt-6">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                        <span className="text-slate-700"><strong>Conhecimento de causa:</strong> Entendemos as entrelinhas dos editais porque já redigimos centenas deles.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                        <span className="text-slate-700"><strong>Visão de liquidação:</strong> Sabemos que a habilitação é só o começo; as certidões precisam estar válidas para o recebimento das faturas.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                        <span className="text-slate-700"><strong>Tradução do cenário:</strong> Transformamos as decisões complexas dos órgãos públicos em orientações diretas para você.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                                <Award className="h-12 w-12 text-blue-600 mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-4">O Fim da Inabilitação Banal</h3>
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    Nossa bagagem prática foi transformada em tecnologia. O LicitaDocs faz a varredura e a guarda dos seus documentos com a mesma precisão exigida pelos fiscais de contrato mais rigorosos do Brasil.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- VISÃO E OBJETIVOS --- */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">
                            <Target className="h-4 w-4" /> Visão e Objetivos
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Democratizar o acesso às compras públicas em todo o Brasil.</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Queremos ser o ponto seguro de descanso para os gestores. Não importa se você é um MEI no seu primeiro edital ou uma multinacional com dezenas de contratos. Nossa meta é ser o parceiro de bastidor que garante o seu acesso descomplicado ao mercado governamental.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="p-8 bg-blue-600 text-white rounded-2xl shadow-lg">
                            <Anchor className="h-8 w-8 text-blue-200 mb-4" />
                            <h4 className="font-bold text-xl mb-3">Seu Porto Seguro</h4>
                            <p className="text-blue-100 leading-relaxed">Chega de infinitos alertas que só geram ansiedade. O objetivo do sistema é garantir que, no momento em que você precisar de uma certidão, ela estará lá, válida e a um clique de distância.</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                            <Map className="h-8 w-8 text-blue-600 mb-4" />
                            <h4 className="font-bold text-xl mb-3 text-slate-900">Foco nas Vendas</h4>
                            <p className="text-slate-600 leading-relaxed">Você foca em buscar os melhores preços e negociar bons contratos. O trabalho burocrático de atualizar e organizar a papelada é responsabilidade nossa.</p>
                        </div>
                    </div>
                </section>

                {/* --- VALORES CORE (O NOSSO DNA) - EXPANDIDO PARA 6 PILARES --- */}
                <section className="py-24 bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">O Nosso DNA</h2>
                            <p className="text-3xl font-bold">Os pilares que sustentam o nosso trabalho.</p>
                        </div>

                        {/* Grid de 3 Colunas x 2 Linhas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <ValueCard
                                icon={<LayoutDashboard className="h-8 w-8" />}
                                title="Simplicidade e Organização"
                                description="O sistema não exige dezenas de configurações complexas. Ele é direto ao ponto, limpo e focado em resolver um único problema de forma perfeita."
                            />
                            <ValueCard
                                icon={<Scale className="h-8 w-8" />}
                                title="Ética e Transparência"
                                description="Estabelecemos confiança absoluta. Se houver um erro ou pendência no seu CNPJ, nós avisamos antes que isso vire uma bola de neve gigante."
                            />
                            <ValueCard
                                icon={<Handshake className="h-8 w-8" />}
                                title="Preço Justo (Ganha-Ganha)"
                                description="Defendemos um valor altamente acessível porque acreditamos em parcerias duradouras, onde os dois lados saem felizes e lucrando com a ferramenta."
                            />
                            <ValueCard
                                icon={<MessageSquare className="h-8 w-8" />}
                                title="Tradutores do Juridiquês"
                                description="Nosso atendimento entende o tecniquês do órgão público e traduz isso em linguagem acessível e prática para a sua equipe."
                            />
                            <ValueCard
                                icon={<FileCheck className="h-8 w-8" />}
                                title="Exatidão Documental"
                                description="Entregamos a segurança jurídica que você precisa. Nada de excesso de informações inúteis, apenas o que a Lei 14.133/21 realmente exige."
                            />
                            <ValueCard
                                icon={<Target className="h-8 w-8" />}
                                title="Parceria Duradoura"
                                description="Nosso contrato abrange 12 meses porque nossa ajuda não acaba no dia da licitação. Protegemos seu CNPJ até o momento de faturar e receber."
                            />
                        </div>
                    </div>
                </section>

                {/* --- CTA FINAL --- */}
                <section className="py-24 bg-white text-center">
                    <div className="max-w-2xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
                            Pronto para deixar a burocracia com especialistas?
                        </h2>
                        <p className="text-lg text-slate-600 mb-8">
                            Acesse suas certidões com simplicidade. E vença a próxima licitação.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button size="lg" onClick={() => navigate('/register')}>
                                Criar Conta Agora
                            </Button>
                            <Button variant="ghost" onClick={() => navigate('/demonstracao')}>
                                Entender o Processo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

            </main>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-slate-900">LicitaDocs</span>
                </div>
                <p className="text-slate-400 text-sm">© 2026 LicitaDocs Gestão Documental. Braúnas, MG - Brasil.</p>
            </footer>
        </div>
    );
}

/**
 * Propriedades do componente ValueCard.
 */
interface ValueCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

/**
 * Subcomponente interno para renderizar os cartões da secção "Valores Core".
 */
function ValueCard({ icon, title, description }: ValueCardProps) {
    return (
        <div className="text-center space-y-4 group p-4 border border-transparent hover:border-slate-800 rounded-2xl transition-all duration-300">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    );
}