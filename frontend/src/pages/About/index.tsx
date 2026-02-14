import { useNavigate } from 'react-router-dom';
import {
    Users,
    Target,
    ShieldCheck,
    ChevronLeft,
    FileCheck,
    Globe,
    Lightbulb,
    Award,
    ArrowRight
} from 'lucide-react';

// Nossos Componentes UI
import { Button } from '../../components/ui/Button';

export function AboutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">

            {/* --- HEADER --- */}
            <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            Licita<span className="text-blue-600">Doc</span>
                        </span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                        Entrar
                    </Button>
                </div>
            </header>

            <main className="flex-1">

                {/* --- HERO INSTITUCIONAL --- */}
                <section className="py-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            Tecnologia Portuguesa para <br />
                            <span className="text-blue-600">Simplificar o Setor Público.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                            O LicitaDoc nasceu da necessidade de transformar processos burocráticos e lentos em fluxos de trabalho ágeis, seguros e inteligentes.
                        </p>
                    </div>
                    {/* Elemento decorativo de fundo */}
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl opacity-50" />
                </section>

                {/* --- MISSÃO E VISÃO --- */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                                    <Target className="h-4 w-4" /> A Nossa Missão
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900">Empoderar empresas através da inteligência documental.</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Queremos que cada empresa, independentemente do seu tamanho, tenha a mesma capacidade técnica de participar e vencer grandes licitações, eliminando a barreira da burocracia documental.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Globe className="h-6 w-6 text-blue-600 mb-3" />
                                    <h4 className="font-bold text-sm mb-1 text-slate-900">Abrangência</h4>
                                    <p className="text-xs text-slate-500">Atuamos em todos os distritos e câmaras municipais.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Award className="h-6 w-6 text-blue-600 mb-3" />
                                    <h4 className="font-bold text-sm mb-1 text-slate-900">Conformidade</h4>
                                    <p className="text-xs text-slate-500">Alinhados com o Código dos Contratos Públicos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square bg-blue-600 rounded-3xl overflow-hidden shadow-2xl relative">
                                {/* Aqui ficaria uma imagem de alta qualidade da equipa ou do escritório */}
                                <div className="absolute inset-0 bg-linear-to-t from-blue-900/60 to-transparent flex items-end p-8">
                                    <p className="text-white text-lg font-medium italic">
                                        "A inovação não é apenas sobre código, é sobre facilitar a vida de quem constrói o país."
                                    </p>
                                </div>
                            </div>
                            {/* Stats flutuantes para dar dinamismo */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                                <span className="block text-3xl font-bold text-blue-600">5k+</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Certidões Emitidas</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- VALORES CORE --- */}
                <section className="py-24 bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">O Nosso DNA</h2>
                            <p className="text-3xl font-bold">Valores que guiam cada linha de código.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <ValueCard
                                icon={<Lightbulb className="h-8 w-8" />}
                                title="Inovação Constante"
                                description="Não aceitamos o 'sempre foi assim'. Usamos IA e automação para redefinir o que é possível na gestão pública."
                            />
                            <ValueCard
                                icon={<ShieldCheck className="h-8 w-8" />}
                                title="Ética e Transparência"
                                description="Lidamos com dados sensíveis com o máximo rigor e clareza. A segurança do cliente é a nossa prioridade absoluta."
                            />
                            <ValueCard
                                icon={<Users className="h-8 w-8" />}
                                title="Foco no Utilizador"
                                description="Criamos ferramentas para pessoas. Cada funcionalidade é pensada para poupar tempo e reduzir o stress do dia-a-dia."
                            />
                        </div>
                    </div>
                </section>

                {/* --- CTA FINAL --- */}
                <section className="py-24 bg-white text-center">
                    <div className="max-w-2xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
                            Junte-se à revolução na gestão documental.
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button size="lg" onClick={() => navigate('/register')}>
                                Criar Conta Agora
                            </Button>
                            <Button variant="ghost" onClick={() => navigate('/demonstracao')}>
                                Ver Demonstração <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

            </main>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-slate-900">LicitaDoc</span>
                </div>
                <p className="text-slate-400 text-sm">© 2026 LicitaDoc Tecnologia S.A. Lisboa, Portugal.</p>
            </footer>
        </div>
    );
}

// Componente Interno para os Valores
function ValueCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="text-center space-y-4 group">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    );
}