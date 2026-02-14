import { useNavigate } from 'react-router-dom';
import {
    Zap,
    ShieldCheck,
    Bot,
    ArrowRight,
    FileText,
    Search,
    Bell,
    Clock,
    FileCheck,
    ChevronLeft,
    Lock
} from 'lucide-react';

// Nossos Componentes UI
import { Button } from '../../components/ui/Button';

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
                    >
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Voltar para Início</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1 rounded-lg">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">LicitaDoc</span>
                    </div>

                    <div className="w-24 md:block hidden"></div> {/* Spacer para centralizar logo se necessário */}
                </div>
            </header>

            <main className="flex-1">

                {/* --- HERO DA DEMO --- */}
                <section className="py-16 px-4 text-center bg-slate-50 border-b border-slate-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Conheça o Poder do <span className="text-blue-600">LicitaDoc</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Veja como transformamos o caos documental em uma vantagem competitiva para sua empresa participar de qualquer licitação.
                    </p>
                </section>

                {/* --- PILLAR 1: AUTOMAÇÃO --- */}
                <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Certidões Automáticas</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Esqueça o trabalho manual de acessar dezenas de sites governamentais todos os meses. Nosso sistema monitora e emite certidões federais, estaduais e municipais de forma autônoma.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Monitoramento 24h de regularidade fiscal.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Emissão de CNDs com um clique.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <CheckCircleIcon /> Histórico completo de todas as emissões.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 shadow-inner">
                        {/* Ilustração ou Placeholder de UI */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase">Status de Certidões</span>
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
                                        <Bell className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                                        <span className="text-xs font-bold block">Alertas de Vencimento</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <Lock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                                        <span className="text-xs font-bold block">Segurança Bancária</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <Clock className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                                        <span className="text-xs font-bold block">Timeline de Versões</span>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                        <FileCheck className="h-6 w-6 mx-auto mb-2 text-green-400" />
                                        <span className="text-xs font-bold block">Validação Digital</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold">Seu Cofre Inviolável</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Centralize documentos de habilitação jurídica, técnica e financeira. Organize tudo por empresa (Multi-Tenant) e receba avisos preventivos antes de qualquer documento vencer.
                            </p>
                            <p className="text-sm text-slate-500 italic">
                                "Nunca mais perca uma oportunidade porque um contrato social ou atestado técnico estava desatualizado."
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- PILLAR 3: INTELIGÊNCIA ARTIFICIAL --- */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mb-8">
                        <Bot className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Consultoria Jurídica via IA</h2>
                    <p className="text-slate-600 max-w-3xl mb-12 leading-relaxed text-lg">
                        Nossa IA foi treinada especificamente no universo das licitações. Ela analisa editais complexos em segundos e te avisa exatamente o que você precisa para ser habilitado, sem precisar ler 200 páginas de PDF.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 w-full">
                        <div className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:border-purple-300 transition-colors">
                            <Search className="h-6 w-6 text-purple-500 mb-4" />
                            <h4 className="font-bold text-slate-900 mb-2">Análise de Editais</h4>
                            <p className="text-sm text-slate-500">Faça o upload do edital e pergunte: "Quais são as exigências de qualificação técnica deste processo?"</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:border-purple-300 transition-colors">
                            <Bot className="h-6 w-6 text-purple-500 mb-4" />
                            <h4 className="font-bold text-slate-900 mb-2">Chatbot Concierge</h4>
                            <p className="text-sm text-slate-500">Seu assistente pessoal disponível 24h para tirar dúvidas sobre legislação e o estado dos seus documentos.</p>
                        </div>
                    </div>
                </section>

                {/* --- CTA FINAL --- */}
                <section className="py-24 bg-blue-600 text-white text-center">
                    <h2 className="text-3xl font-bold mb-8">Pronto para elevar o nível da sua empresa?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 px-10 text-lg font-bold"
                            onClick={() => navigate('/register')}
                        >
                            Começar Agora
                        </Button>
                        <p className="text-blue-100 text-sm">Contratação rápida • 30 dias de garantia</p>
                    </div>
                </section>

            </main>

            <footer className="py-12 bg-white text-center border-t border-slate-100">
                <p className="text-slate-400 text-sm">© 2026 LicitaDoc. Tecnologia para vencer licitações.</p>
            </footer>
        </div>
    );
}

// Icon Helper
function CheckCircleIcon() {
    return (
        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ArrowRight className="h-3 w-3 text-green-600" />
        </div>
    );
}