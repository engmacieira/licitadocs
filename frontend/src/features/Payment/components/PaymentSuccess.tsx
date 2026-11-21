import { CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente PaymentSuccess.
 * @interface PaymentSuccessProps
 */
interface PaymentSuccessProps {
    /** Razão social da empresa que acabou de ser ativada. */
    legalName: string;
    /** URL opcional do comprovante emitido pela Infinite Pay. */
    receiptUrl?: string | null;
    /** Callback opcional para ir imediatamente ao Dashboard. */
    onGoToDashboard?: () => void;
}

/**
 * Ecrã de feedback visual exibido após a confirmação do pagamento.
 */
export function PaymentSuccess({ legalName, receiptUrl, onGoToDashboard }: PaymentSuccessProps) {
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
                        <div className="h-full bg-green-500 animate-pulse w-full origin-left duration-3000 transition-transform" />
                    </div>
                </div>

                {(onGoToDashboard || receiptUrl) && (
                    <div className="space-y-3">
                        {onGoToDashboard && (
                            <Button onClick={onGoToDashboard} className="w-full" size="lg">
                                Ir para o Dashboard
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {receiptUrl && (
                            <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Ver Comprovante
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
