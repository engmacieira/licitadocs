import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
// Importamos os novos ícones alinhados com a nova copy (Compass e Award)
import { FileCheck, Compass, Award, ArrowRight, ChevronRight } from 'lucide-react';

import { ScrollToTop } from '../../components/ui/ScrollToTop';

/**
 * Página de aterragem (Landing Page) pública da aplicação.
 * * ESTRATÉGIA DE UX & COPY:
 * - Foco na Autoridade: Destaca os 10+ anos de experiência da equipe (humanização > automação fria).
 * - Foco no Iniciante: Promete direcionamento e fim da confusão burocrática.
 * - Foco no Retorno Financeiro: A "Blindagem Contratual" de 12 meses garante que
 * a empresa não sofra bloqueios de pagamento do órgão público por certidões vencidas.
 */
export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <ScrollToTop />
            {/* --- HEADER / NAVEGAÇÃO --- */}
            <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">LicitaDocs</span>
                    </div>

                    <nav className="flex gap-4">
                        <Button variant="primary" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                    </nav>
                </div>
            </header>

            {/* --- HERO SECTION (TOPO DA PÁGINA) --- */}
            <main className="flex-1">
                <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">

                    {/* Copy H1: Promessa clara focada no alívio da dor burocrática */}
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Suas certidões sempre em dia. <br />
                        <span className="text-blue-600">Nós cuidamos da burocracia para você.</span>
                    </h1>

                    {/* Copy P: Expectativa alinhada. Foco na ferramenta documental construída por especialistas. */}
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                        A plataforma de gestão documental criada por quem tem mais de 10 anos de experiência em licitações. Mantemos suas certidões organizadas e atualizadas durante todo o contrato, evitando faturas retidas. Tudo isso por menos de R$ 15 ao mês.
                    </p>

                    {/* CTAs (Call to Actions): Nomenclaturas focadas em valor */}
                    <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={() => navigate('/register')}>
                            Assinar Agora <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/demonstracao')}>
                            Como Funciona? <ChevronRight className="ml-2 h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                </section>

                {/* --- SEÇÃO DE BENEFÍCIOS (FEATURES) --- */}
                <section id="features" className="bg-slate-50 py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Grid contendo os 3 pilares da proposta de valor */}
                        <div className="grid md:grid-cols-3 gap-8">

                            {/* PILAR 1: Foco em empresas iniciantes (Mapeamento) */}
                            <FeatureCard
                                icon={<Compass className="h-8 w-8 text-blue-600" />}
                                title="Mapeamento Descomplicado"
                                description="Está começando agora e não sabe quais certidões precisa? Nossa equipe avalia o seu CNPJ e organiza exatamente o que os órgãos públicos vão exigir. Sem confusão, direto ao ponto."
                            />

                            {/* PILAR 2: Foco em autoridade e segurança (Experiência Humana) */}
                            <FeatureCard
                                icon={<Award className="h-8 w-8 text-blue-600" />}
                                title="Gestão Especializada"
                                description="Não somos apenas um software. Seu cofre é gerenciado por quem entende. São mais de 10 anos de experiência real nos bastidores de contratos e licitações trabalhando a seu favor."
                            />

                            {/* PILAR 3: Foco na dor financeira (Manutenção dos 12 meses) */}
                            <FeatureCard
                                icon={<FileCheck className="h-8 w-8 text-blue-600" />}
                                title="Blindagem de Pagamentos"
                                description="A lei exige regularidade fiscal durante toda a execução do contrato. Nós atualizamos seus documentos antes do vencimento para garantir que o órgão público nunca bloqueie suas faturas."
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* --- FOOTER SIMPLES --- */}
            <footer className="bg-white border-t border-slate-100 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 LicitaDocs. Todos os direitos reservados. <br className="sm:hidden" />
                    <span className="hidden sm:inline"> • </span>
                    Tecnologia e Experiência em Licitações Públicas.
                </div>
            </footer>
        </div>
    );
}

/**
 * Propriedades do componente FeatureCard.
 * @interface FeatureCardProps
 */
interface FeatureCardProps {
    /** Ícone representativo da funcionalidade (componente Lucide React). */
    icon: React.ReactNode;
    /** Título de destaque da funcionalidade (focado no benefício). */
    title: string;
    /** Texto descritivo que detalha o valor entregue para o cliente. */
    description: string;
}

/**
 * Subcomponente visual que exibe um cartão de funcionalidade (feature) na Landing Page.
 * Utilizado para manter a consistência visual no grid de benefícios.
 */
function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}