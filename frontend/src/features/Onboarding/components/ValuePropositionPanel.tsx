import { Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * Painel visual de Proposta de Valor (Marketing Panel).
 * Exibido no lado direito do fluxo de registo (Onboarding) em ecrãs grandes (desktop).
 * Reforça os benefícios do sistema, segurança e transparência de preços 
 * para reduzir o abandono do carrinho (drop-off) durante o registo.
 */
export function ValuePropositionPanel() {
    return (
        <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
            {/* Efeitos visuais de fundo (Glow) */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto w-full">
                <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                    Você está a um passo de <br /> simplificar sua rotina.
                </h2>

                {/* Card de Resumo do Plano (Transparência de Preço) */}
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
                            <span className="text-sm text-slate-300">Busca e renovação automática de certidões federais, estaduais e municipais.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                            <span className="text-sm text-slate-300">Alertas imediatos em caso de pendências fiscais.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                            <span className="text-sm text-slate-300">Cofre digital seguro com modelos padronizados.</span>
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

                <div className="flex items-center gap-3 text-sm text-slate-400">
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                    <span>Seus dados são criptografados e enviados com segurança.</span>
                </div>
            </div>
        </div>
    );
}