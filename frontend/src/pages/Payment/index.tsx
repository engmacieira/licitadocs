import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    CreditCard, Lock, ShieldCheck, CheckCircle2,
    ArrowRight, Wallet
} from 'lucide-react';

// Integração Real
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Componentes UI
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. DADOS REAIS: Pegamos do contexto de autenticação
    const { currentCompany } = useAuth();

    // Cast 'any' para evitar erros de TypeScript se a interface estiver desatualizada
    const companyData = currentCompany as any;

    // Prioridade: Dados do Banco > Dados da Navegação > Fallback
    const legalName = companyData?.razao_social || location.state?.legalName || "Sua Empresa";
    const responsibleName = companyData?.responsavel_nome || location.state?.responsibleName || "Seu Nome";

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Validação de Segurança
    useEffect(() => {
        // Se não tiver empresa logada e nem dados no state, algo está errado
        if (!currentCompany && !location.state?.email) {
            // Nota: Como o login é assíncrono, damos um tempo ou confiamos no ProtectedRoute/AuthContext
            // Mas aqui deixamos passar se estiver carregando
        }
    }, [currentCompany, location.state, navigate]);

    const handlePayment = async () => {
        if (!currentCompany?.id) {
            toast.error("Sessão expirada", {
                description: "Por favor, faça login novamente para continuar."
            });
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Simulação do Gateway (UX: Tempo de processamento bancário)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. CHAMADA REAL À API
            // Atualiza o status da empresa no banco de dados para "Pagamento Ativo"
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=payment`);

            // Sucesso!
            setIsSuccess(true);
            toast.success("Pagamento confirmado!", {
                description: "Sua assinatura foi ativada com sucesso."
            });

            // 3. Redireciona para o Dashboard (Já logado)
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (error) {
            console.error(error);
            toast.error("Falha no pagamento", {
                description: "Não foi possível processar a transação. Tente novamente."
            });
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
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
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">

                {/* LADO ESQUERDO: Resumo do Pedido */}
                <div className="bg-slate-900 p-8 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Decorativo */}
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
                                    <p className="text-sm text-slate-400">Assinatura Mensal</p>
                                </div>
                                <span className="font-medium">R$ 299,90</span>
                            </div>

                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Subtotal</span>
                                <span>R$ 299,90</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-400 font-medium">
                                <span>Desconto (Beta Tester)</span>
                                <span>- R$ 299,90</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 pt-6 border-t border-slate-700">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-400">Total a pagar hoje</span>
                            <span className="text-3xl font-bold text-white">R$ 0,00</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Seu período de teste gratuito de 30 dias começa hoje.
                        </p>
                    </div>
                </div>

                {/* LADO DIREITO: Formulário de Pagamento */}
                <div className="p-8 md:w-3/5 bg-white relative">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Dados de Pagamento</h2>
                        <div className="flex gap-2">
                            <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                            <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                            <div className="w-8 h-5 bg-slate-100 rounded border border-slate-200" />
                        </div>
                    </div>

                    {/* Simulação de Formulário (Visual Only) */}
                    <div className="space-y-5 opacity-70 pointer-events-none select-none grayscale-[0.5]">
                        <Input
                            label="Número do Cartão"
                            icon={<CreditCard className="text-slate-400 h-5 w-5" />}
                            placeholder="0000 0000 0000 0000"
                            defaultValue="4242 4242 4242 4242"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Validade"
                                placeholder="MM/AA"
                                defaultValue="12/28"
                            />
                            <Input
                                label="CVV"
                                placeholder="123"
                                defaultValue="***"
                                icon={<Lock className="text-slate-400 h-4 w-4" />}
                            />
                        </div>

                        <Input
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
                                Nenhum valor será cobrado no seu cartão real. Este é um procedimento de ativação de conta.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button
                            size="lg"
                            className="w-full h-14 text-lg shadow-lg shadow-blue-500/20"
                            onClick={handlePayment}
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
            </div>
        </div>
    );
}