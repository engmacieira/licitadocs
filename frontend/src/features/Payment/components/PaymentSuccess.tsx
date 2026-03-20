import { CheckCircle2 } from 'lucide-react';

/**
 * Propriedades do componente PaymentSuccess.
 * @interface PaymentSuccessProps
 */
interface PaymentSuccessProps {
    /** Razão social da empresa que acabou de ser ativada. */
    legalName: string;
}

/**
 * Ecrã de feedback visual exibido após a aprovação do pagamento.
 * Mantém o utilizador engajado com uma barra de progresso falsa (UX)
 * enquanto aguarda o redirecionamento automático para o Dashboard.
 */
export function PaymentSuccess({ legalName }: PaymentSuccessProps) {
    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-green-100">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tudo Pronto!</h2>
                <p className="text-slate-600 mb-6">
                    O pagamento foi confirmado e a conta da empresa <strong>{legalName}</strong> está ativa.
                </p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                    <p className="text-sm text-slate-500">Acessando seu Dashboard...</p>
                    <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        {/* Barra de progresso animada via CSS (Tailwind) */}
                        <div className="h-full bg-green-500 animate-pulse w-full origin-left duration-3000 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
}