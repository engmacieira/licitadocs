import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, ShieldCheck, Award, Anchor } from 'lucide-react';

/**
 * Painel visual de Proposta de Valor (Marketing Panel).
 * * ESTRATÉGIA DE UX & COPY:
 * - Carrossel Automático: Mantém o usuário engajado lendo os benefícios enquanto preenche os dados.
 * - Reforço dos Pilares: (1) Especialistas, (2) Fim de bloqueio de faturas, (3) Foco em vendas.
 * - Transparência de Preço: O bloco de investimento é mantido FIXO para ancorar que o 
 * valor é justo e sem pegadinhas. Reduz o drop-off.
 */
export function ValuePropositionPanel() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Conteúdo do Carrossel de Benefícios
    const slides = [
        {
            icon: <Award className="h-8 w-8 text-blue-400" />,
            title: "Especialistas no Controle",
            text: "Seu CNPJ será monitorado por quem tem mais de 10 anos de experiência julgando licitações. Esqueça a ansiedade e as madrugadas em sites instáveis."
        },
        {
            icon: <ShieldCheck className="h-8 w-8 text-green-400" />,
            title: "Blindagem de Pagamentos",
            text: "A lei exige regularidade contínua. Garantimos suas certidões válidas o ano inteiro para que o órgão público não retenha as suas faturas."
        },
        {
            icon: <Anchor className="h-8 w-8 text-purple-400" />,
            title: "O Seu Porto Seguro",
            text: "Foque em buscar preços, negociar e vencer. O trabalho burocrático de atualizar e organizar a papelada chata é responsabilidade nossa."
        }
    ];

    // Efeito para transição automática do carrossel a cada 5 segundos
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
            {/* Efeitos visuais de fundo (Glow) */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto w-full">
                <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                    Você está a um passo de <br /> simplificar sua rotina.
                </h2>

                {/* --- CARROSSEL DE BENEFÍCIOS --- */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 h-48 relative overflow-hidden flex flex-col justify-center backdrop-blur-sm">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 p-6 flex flex-col justify-center transition-all duration-700 ease-in-out ${index === currentSlide
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 translate-x-8 pointer-events-none'
                                }`}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                {slide.icon}
                                <h3 className="font-bold text-lg text-white">{slide.title}</h3>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {slide.text}
                            </p>
                        </div>
                    ))}

                    {/* Indicadores (Dots) do Carrossel */}
                    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                                    }`}
                                aria-label={`Ir para o slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* --- CARD FIXO DE RESUMO (TRANSPARÊNCIA DE PREÇO) --- */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <Zap className="h-6 w-6 text-blue-400" />
                        <div>
                            <h3 className="font-semibold text-white">LicitaDocs Anual</h3>
                            <p className="text-xs text-blue-300">Licença atrelada a 1 CNPJ</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                            <span className="text-sm text-slate-300">Monitoramento e renovação ativa de certidões.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                            <span className="text-sm text-slate-300">Garantia de regularidade para receber faturas.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                            <span className="text-sm text-slate-300">Cofre digital com modelos padronizados (Lei 14.133/21).</span>
                        </div>
                    </div>

                    {/* Destacando o valor real sem enganação */}
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">Investimento</span>
                        <div className="text-right">
                            <div className="text-white font-bold text-xl">R$ 178,80<span className="text-sm text-slate-400 font-normal">/ano</span></div>
                            <div className="text-xs text-blue-400">Equivale a apenas R$ 14,90/mês</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-400 justify-center">
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                    <span>Seus dados são criptografados e trafegam com segurança máxima.</span>
                </div>
            </div>
        </div>
    );
}