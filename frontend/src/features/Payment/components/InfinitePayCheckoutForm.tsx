import { ShieldCheck, Lock, ArrowRight, CreditCard, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente InfinitePayCheckoutForm.
 */
interface InfinitePayCheckoutFormProps {
    /** Razão social da empresa exibida no checkout. */
    legalName: string;
    /** Nome do responsável legal ou pagador. */
    responsibleName: string;
    /** Estado de carregamento controlado pelo Orquestrador. */
    isProcessing: boolean;
    /** Callback disparado ao clicar no botão de pagar. */
    onPayment: () => void;
}

/**
 * Formulário de checkout integrado à Infinite Pay.
 * Explica ao usuário o redirecionamento seguro para o ambiente da Infinite Pay,
 * mantendo compatibilidade visual com o componente OrderSummary.
 */
export function InfinitePayCheckoutForm({
    legalName,
    responsibleName,
    isProcessing,
    onPayment,
}: InfinitePayCheckoutFormProps) {
    return (
        <div className="p-8 md:w-3/5 bg-white relative flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Pagamento Seguro</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Checkout processado via Infinite Pay
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                            <QrCode className="h-3.5 w-3.5" /> PIX
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                            <CreditCard className="h-3.5 w-3.5" /> Cartão
                        </span>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Empresa</span>
                        <span className="font-medium text-slate-900 text-right">{legalName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Responsável</span>
                        <span className="font-medium text-slate-900 text-right">{responsibleName}</span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold flex items-center gap-1.5">
                            Redirecionamento Seguro para Infinite Pay
                            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                        </p>
                        <p className="text-blue-800/90 mt-1">
                            Ao continuar, você será redirecionado para o ambiente criptografado da Infinite Pay para concluir o pagamento via PIX ou Cartão de Crédito. Após a confirmação, seu acesso será liberado automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <Button
                    size="lg"
                    className="w-full h-14 text-lg shadow-lg shadow-blue-500/20"
                    onClick={onPayment}
                    isLoading={isProcessing}
                >
                    {isProcessing ? 'Gerando checkout...' : 'Pagar com Infinite Pay'}
                    {!isProcessing && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Lock className="h-3 w-3" />
                    Ambiente protegido com criptografia de ponta a ponta.
                </div>
            </div>
        </div>
    );
}
