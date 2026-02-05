import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const userEmail = location.state?.email; // Recupera o email vindo das telas anteriores

    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        if (!userEmail) {
            toast.error("Erro de sessão: E-mail não identificado. Comece o cadastro novamente.");
            return;
        }

        setIsProcessing(true);

        try {
            // Chama o endpoint de simulação que acabamos de criar
            const response = await fetch('http://localhost:8000/auth/simulate-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail }),
            });

            if (!response.ok) throw new Error('Falha no pagamento');

            toast.success("Pagamento Aprovado! Sua conta foi ativada.");

            // Delay para efeito visual e redirecionamento para o Login Real
            setTimeout(() => {
                navigate('/login', { state: { email: userEmail } }); // Já preenche o email no login pra facilitar
            }, 2000);

        } catch (error) {
            toast.error("Erro ao processar pagamento. Tente novamente.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">

                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Checkout Seguro</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Finalize a assinatura para liberar seu acesso imediato.
                    </p>
                </div>

                {/* Resumo do Pedido */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-700">Plano LicitaDocs Pro</span>
                        <span className="font-bold text-slate-900">R$ 299,00/mês</span>
                    </div>
                    <div className="text-xs text-slate-500 border-t border-slate-200 pt-2 mt-2">
                        Inclui: Gestão de Certidões, Robô de Captura Automática e Dashboard.
                    </div>
                </div>

                {/* Simulação de Cartão (Visual apenas) */}
                <div className="space-y-4 opacity-50 pointer-events-none grayscale">
                    {/* Campos fake apenas para dar a sensação de checkout */}
                    <div className="border p-2 rounded bg-slate-100">
                        <span className="text-xs text-slate-500">Número do Cartão</span>
                        <div className="text-slate-400">•••• •••• •••• 4242</div>
                    </div>
                    <div className="flex gap-4">
                        <div className="border p-2 rounded bg-slate-100 flex-1">
                            <span className="text-xs text-slate-500">Validade</span>
                            <div className="text-slate-400">12/28</div>
                        </div>
                        <div className="border p-2 rounded bg-slate-100 flex-1">
                            <span className="text-xs text-slate-500">CVV</span>
                            <div className="text-slate-400">•••</div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-slate-400 italic">
                    * Ambiente de Simulação: Nenhum valor real será cobrado.
                </div>

                <Button
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processando...' : (
                        <span className="flex items-center justify-center gap-2">
                            <Lock className="h-4 w-4" /> Pagar e Ativar Conta
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}