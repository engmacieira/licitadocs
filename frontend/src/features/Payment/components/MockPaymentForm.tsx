import { CreditCard, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

/**
 * Propriedades do componente MockPaymentForm.
 * @interface MockPaymentFormProps
 */
interface MockPaymentFormProps {
    /** Nome do responsável legal para preencher o cartão (UX). */
    responsibleName: string;
    /** Estado de carregamento controlado pelo Orquestrador. */
    isProcessing: boolean;
    /** Função de callback disparada ao clicar no botão de pagar. */
    onPayment: () => void;
}

/**
 * Formulário simulado de pagamento (Mock).
 * Atualmente atua como placeholder visual (dívida técnica isolada).
 * Impede a interação nos campos de cartão e exibe um aviso de ambiente de teste.
 */
export function MockPaymentForm({ responsibleName, isProcessing, onPayment }: MockPaymentFormProps) {
    return (
        <div className="p-8 md:w-3/5 bg-white relative">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Dados de Pagamento</h2>
                {/* Ícones genéricos de cartões de crédito (fakes) */}
                <div className="flex gap-2">
                    <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                    <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                    <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                </div>
            </div>

            {/* Simulação de Formulário (Visual Only - Bloqueado via CSS) */}
            <div className="space-y-5 opacity-70 pointer-events-none select-none grayscale-[0.5]">
                <Input
                    id="cardNumber"
                    label="Número do Cartão"
                    icon={<CreditCard className="text-slate-400 h-5 w-5" />}
                    placeholder="0000 0000 0000 0000"
                    defaultValue="4242 4242 4242 4242"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        id="expiry"
                        label="Validade"
                        placeholder="MM/AA"
                        defaultValue="12/28"
                    />
                    <Input
                        id="cvv"
                        label="CVV"
                        placeholder="123"
                        defaultValue="***"
                        icon={<Lock className="text-slate-400 h-4 w-4" />}
                    />
                </div>

                <Input
                    id="cardHolder"
                    label="Nome no Cartão"
                    placeholder="Nome Completo"
                    defaultValue={responsibleName?.toUpperCase() || "SEU NOME"}
                />
            </div>

            {/* Aviso de Simulação */}
            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 items-start">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold">Ambiente de Teste Seguro</p>
                    <p className="opacity-90">
                        Nenhum valor será cobrado no seu cartão real. Este é um procedimento de ativação de conta simulado.
                    </p>
                </div>
            </div>

            {/* Botão de Ação Controlado pelo Orquestrador */}
            <div className="mt-8">
                <Button
                    size="lg"
                    className="w-full h-14 text-lg shadow-lg shadow-blue-500/20"
                    onClick={onPayment}
                    isLoading={isProcessing}
                >
                    {isProcessing ? 'Processando...' : 'Confirmar e Ativar Conta'}
                    {!isProcessing && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Lock className="h-3 w-3" />
                    Pagamento processado com criptografia de ponta a ponta.
                </div>
            </div>
        </div>
    );
}