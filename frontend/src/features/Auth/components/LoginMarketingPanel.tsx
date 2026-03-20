import { ShieldCheck, FileText, CheckCircle2, Clock } from 'lucide-react';

/**
 * Painel visual de Marketing e Prova Social (Social Proof).
 * Exibido no lado direito do ecrã de Login em dispositivos Desktop.
 * Destaca o principal diferencial do sistema (automação vs avisos)
 * para reforçar o valor do produto a cada acesso.
 */
export function LoginMarketingPanel() {
    return (
        <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto w-full">
                {/* Card Simulando a Interface */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-10 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-green-400" />
                            <span className="font-semibold text-white">Status do CNPJ</span>
                        </div>
                        <span className="text-xs font-bold bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                            100% REGULAR
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col bg-white/5 rounded-lg p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-200">CND Federal (Receita)</span>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                            </div>
                            {/* Microtexto provando a automação */}
                            <div className="flex items-center gap-1.5 pl-6">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400">Renovada automaticamente hoje às 08:15</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Texto de Impacto Focado no Diferencial */}
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                    Muito mais que um <br /> cofre digital.
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                    Esqueça os alertas que só te dão trabalho. Nosso sistema busca e emite suas novas certidões automaticamente antes do vencimento.
                </p>
            </div>
        </div>
    );
}