import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FileCheck, ShieldCheck, Zap } from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / Nav */}
            <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">LicitaDocs</span>
                    </div>

                    <nav className="flex gap-4">
                        <Button variant="ghost" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/register')}>
                            Cadastrar Empresa
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Suas certidões sempre em dia, <br />
                        <span className="text-blue-600">sem você mover um dedo.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                        A plataforma que emite automaticamente novas certidões antes do vencimento.
                        Não enviamos alertas para te dar trabalho: entregamos o documento pronto.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={() => navigate('/register')}>
                            Quero Contratar
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                            Como Funciona
                        </Button>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="bg-slate-50 py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* CORREÇÃO 2: Ajuste na promessa de valor (De "Avisar" para "Fazer por você") */}
                            <FeatureCard
                                icon={<Zap className="h-8 w-8 text-blue-600" />}
                                title="Renovação Automática"
                                description="Esqueça datas de validade. O robô busca a nova certidão na fonte assim que a atual vence. Você entra apenas para baixar."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="h-8 w-8 text-blue-600" />}
                                title="Sempre Habilitado"
                                description="Elimine o risco de inabilitação por esquecimento. Seu repositório de documentos estará sempre com as versões vigentes."
                            />
                            <FeatureCard
                                icon={<FileCheck className="h-8 w-8 text-blue-600" />}
                                title="Auditoria Completa"
                                description="Histórico imutável de todas as certidões já emitidas. Segurança jurídica e organização para sua empresa."
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Simples */}
            <footer className="bg-white border-t border-slate-100 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 LicitaDocs. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );
}