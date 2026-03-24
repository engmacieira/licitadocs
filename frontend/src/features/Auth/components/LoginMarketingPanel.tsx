import { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, Award, Anchor, Scale } from 'lucide-react';

/**
 * Painel visual de Marketing e Retenção (Anti-Churn).
 * * ESTRATÉGIA DE UX & COPY:
 * - Card Simulado (Refatorado): Agora reflete o "Diagnóstico Especializado" e não apenas um log de sistema.
 * Mostra que o CNPJ está blindado e aderente à Lei 14.133/21.
 * - Carrossel de Retenção: Reforça o valor contínuo (Blindagem de pagamento, Paz de espírito e Foco em vendas).
 */
export function LoginMarketingPanel() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Conteúdo do Carrossel de Retenção (Anti-Churn)
    const slides = [
        {
            icon: <ShieldCheck className="h-8 w-8 text-green-400" />,
            title: "Blindagem de Faturas",
            text: "Fique tranquilo. Continuamos monitorando sua regularidade para garantir que o órgão público nunca retenha seus pagamentos por certidões vencidas."
        },
        {
            icon: <Anchor className="h-8 w-8 text-blue-400" />,
            title: "O Seu Porto Seguro",
            text: "O trabalho de bastidor é nosso. Foque em negociar e vencer o próximo edital enquanto nossa equipe e tecnologia cuidam do seu CNPJ."
        },
        {
            icon: <Scale className="h-8 w-8 text-purple-400" />,
            title: "Tradução do Juridiquês",
            text: "Seu cofre está estruturado exatamente nos moldes da Nova Lei de Licitações. O que o pregoeiro pedir, já estará pronto para download."
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

                {/* --- CARD SIMULANDO O DIAGNÓSTICO (ALINHADO COM A NOVA COPY) --- */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-12 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 cursor-default">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-green-400" />
                            <span className="font-semibold text-white">Diagnóstico do CNPJ</span>
                        </div>
                        {/* Nova Tag de Status focada no resultado que o cliente quer */}
                        <span className="text-xs font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                            100% BLINDADO
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col bg-white/5 rounded-lg p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-200">Acervo de Habilitação</span>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                            </div>

                            {/* Itens que reforçam a experiência, organização e ausência de pendências */}
                            <div className="flex items-center gap-2 pl-7 mb-2">
                                <Award className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[11px] text-slate-300">Padrão Lei 14.133/21 validado</span>
                            </div>
                            <div className="flex items-center gap-2 pl-7">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400/70" />
                                <span className="text-[11px] text-slate-300">Zero pendências nos órgãos emissores</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CARROSSEL DE MENSAGENS DE RETENÇÃO --- */}
                <div className="h-40 relative flex flex-col justify-start">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col ${index === currentSlide
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4 pointer-events-none'
                                }`}
                        >
                            <h2 className="text-3xl font-bold text-white mb-4 leading-tight flex items-center gap-3">
                                {slide.icon}
                                {slide.title}
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                {slide.text}
                            </p>
                        </div>
                    ))}

                    {/* Indicadores (Dots) do Carrossel */}
                    <div className="absolute -bottom-8 left-0 flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                                    }`}
                                aria-label={`Ir para o slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}