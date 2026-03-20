import { useNavigate } from 'react-router-dom';
import {
    Zap,
    ShieldCheck,
    Bot,
    ArrowRight,
    FileText,
    Clock,
    FileCheck,
    ChevronLeft,
    Lock,
    Users,
    Download
} from 'lucide-react';

// Nossos Componentes UI
import { Button } from '../../components/ui/Button';

/**
 * Página de Demonstração (Demo / Sales Page).
 * Atua como uma página de marketing detalhada para explicar os pilares de valor
 * do sistema (Automação, Cofre e IA) de forma visual antes de exigir o registo.
 * Ideal para conversão de leads (potenciais clientes).
 */
export function DemoPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">

            {/* --- HEADER SIMPLIFICADO --- */}
            <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                        aria-label="Voltar para a página inicial"
                    >
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Voltar para Início</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1 rounded-lg">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">LicitaDocs</span>
                    </div>

                    <div className="w-24 md:block hidden"></div>
                </div>
            </header>

            <main className="flex-1">

                {/* --- HERO DA DEMO --- */}
                <section className="py-16 px-4 text-center bg-slate-50 border-b border-slate-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Conheça o Poder do <span className="text-blue-600">LicitaDocs</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Veja como transformamos o caos documental em uma vantagem competitiva. Mantenha as certidões do seu CNPJ sempre em dia para participar de licitações públicas com segurança.
                    </p>
                </section>

                {/* --- PILLAR 1: AUTOMAÇÃO --- */}
                <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Busca e Renovação Automática</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Esqueça o trabalho manual de acessar dezenas de sites governamentais. Nosso sistema parametrizado capta e atualiza suas certidões federais, estaduais e municipais de forma autônoma.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Inteligência vinculada ao Objeto Social da sua empresa.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Renovação proativa 8 dias antes do vencimento.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Alertas imediatos caso o órgão aponte pendências fiscais.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 shadow-inner">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase">Status do Cofre</span>
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">100% REGULAR</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: "CND Federal (Receita/PGFN)", days: "Vence em 45 dias" },
                                    { name: "FGTS (CRF)", days: "Vence em 12 dias" },
                                    { name: "CND Trabalhista (TST)", days: "Vence em 180 dias" }
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">{doc.days}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- PILLAR 2: COFRE DE DOCUMENTOS (Layout Invertido) --- */}
                <section className="py-20 bg-slate-900 text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-green-400" />
                                        <span className="text-xs font-bold block">Uptime de 99% (SLA)</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <Lock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                                        <span className="text-xs font-bold block">Hospedagem em Nuvem</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                                        <span className="text-xs font-bold block">Usuários Adicionais</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                                        <span className="text-xs font-bold block">Histórico de Vencidos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold">Cofre Digital Seguro e Compartilhado</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Centralize todos os documentos do seu CNPJ em um único lugar. Nossa plataforma foi desenhada sob medida para as exigências da Lei nº 14.133/2021.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircleIcon /> Espaço exclusivo para anexar Contrato Social e Balanços.
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircleIcon /> Cadastre 1 Administrador Master e até 3 usuários de leitura.
                                </li>
                            </ul>
                            <p className="text-sm text-slate-500 italic mt-4">
                                "Nunca mais perca uma oportunidade porque um atestado técnico estava desatualizado ou na máquina de outro funcionário."
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- PILLAR 3: INTELIGÊNCIA E PADRONIZAÇÃO --- */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mb-8">
                        <Bot className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Ferramentas de Habilitação</h2>
                    <p className="text-slate-600 max-w-3xl mb-12 leading-relaxed text-lg">
                        Nós não apenas buscamos suas certidões, mas preparamos o terreno para você vencer. Tenha acesso a assistentes inteligentes e documentação padronizada pronta para uso.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
                        <div className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:border-purple-300 transition-colors">
                            <Download className="h-6 w-6 text-purple-500 mb-4" />
                            <h4 className="font-bold text-slate-900 mb-2">Modelos Padronizados</h4>
                            <p className="text-sm text-slate-500">Faça o download de modelos de Declarações exigidas pela Lei 14.133/21 (ex: Não emprego de menor, Superveniência de fatos). Basta preencher e anexar ao seu cofre.</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:border-purple-300 transition-colors">
                            <Bot className="h-6 w-6 text-purple-500 mb-4" />
                            <h4 className="font-bold text-slate-900 mb-2">Assistente de Editais com IA</h4>
                            <p className="text-sm text-slate-500">Nossa IA analisa a complexidade de editais em segundos e resume exatamente quais documentos de habilitação técnica e jurídica você precisará anexar.</p>
                        </div>
                    </div>
                </section>

                {/* --- CTA FINAL COM PRECIFICAÇÃO CLARA --- */}
                <section className="py-24 bg-blue-600 text-white text-center px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Tudo isso por um valor imbatível</h2>

                    {/* Bloco de Preço */}
                    <div className="mb-10 flex flex-col items-center justify-center">
                        <div className="bg-blue-700/50 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 inline-block">
                            <span className="block text-blue-200 font-medium mb-2 uppercase tracking-wide text-sm">Assinatura Anual</span>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold">R$</span>
                                <span className="text-6xl font-extrabold tracking-tighter">178</span>
                                <span className="text-2xl font-bold">,80</span>
                            </div>
                            <span className="block text-blue-200 mt-2 text-sm">
                                O equivalente a apenas <strong className="text-white">R$ 14,90/mês</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 px-10 text-lg font-bold shadow-xl shadow-blue-900/20"
                            onClick={() => navigate('/register')}
                        >
                            Assinar Agora
                        </Button>
                    </div>
                    <p className="text-blue-100 text-sm mt-6 font-medium">
                        Licença atrelada a 1 CNPJ • Pagamento Seguro via PIX ou Cartão em até 12x
                    </p>
                </section>

            </main>

            <footer className="py-12 bg-white text-center border-t border-slate-100">
                <p className="text-slate-400 text-sm">© 2026 LicitaDocs. Tecnologia para vencer licitações.</p>
            </footer>
        </div>
    );
}

/**
 * Subcomponente auxiliar de interface para exibir um ícone de "check" verde circular.
 * Usado para listas de benefícios na página de Demonstração.
 */
function CheckCircleIcon() {
    return (
        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ArrowRight className="h-3 w-3 text-green-600" />
        </div>
    );
}