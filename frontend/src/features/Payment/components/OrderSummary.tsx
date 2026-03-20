import { Wallet } from 'lucide-react';

/**
 * Componente visual estático que exibe o resumo do pedido no checkout.
 * Mostra o plano escolhido, descontos e o valor total a ser pago.
 */
export function OrderSummary() {
    return (
        <div className="bg-slate-900 p-8 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
            {/* Background Decorativo com Efeito Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>

            <div className="relative z-10">
                <h3 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                    <Wallet className="h-5 w-5" /> Resumo do Pedido
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                        <div>
                            <h4 className="font-bold text-lg">LicitaDoc Business</h4>
                            <p className="text-sm text-slate-400">Assinatura Anual</p>
                        </div>
                        <span className="font-medium">R$ 178,80</span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-400">
                        <span>Subtotal</span>
                        <span>R$ 178,80</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-400 font-medium">
                        <span>Desconto (Lançamento)</span>
                        <span>- R$ 178,80</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-700">
                <div className="flex justify-between items-end">
                    <span className="text-slate-400">Total a pagar hoje</span>
                    <span className="text-3xl font-bold text-white">R$ 0,00</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    O seu período de teste gratuito começa hoje.
                </p>
            </div>
        </div>
    );
}