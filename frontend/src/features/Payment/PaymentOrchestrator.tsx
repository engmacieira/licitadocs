import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Integração Real
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Subcomponentes Visuais (Vamos criá-los a seguir)
import { PaymentSuccess } from './components/PaymentSuccess';
import { OrderSummary } from './components/OrderSummary';
import { MockPaymentForm } from './components/MockPaymentForm';

/**
 * Orquestrador do fluxo de Pagamento.
 * Gere a validação de sessão, a simulação do gateway de pagamento,
 * a comunicação com a API para ativar a conta e as transições de UI.
 */
export function PaymentOrchestrator() {
    const navigate = useNavigate();
    const location = useLocation();

    const { currentCompany } = useAuth();
    const companyData = currentCompany as any;

    // Prioridade: Dados do Banco > Dados da Navegação > Fallback
    const legalName = companyData?.razao_social || location.state?.legalName || "Sua Empresa";
    const responsibleName = companyData?.responsavel_nome || location.state?.responsibleName || "Seu Nome";

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    /**
     * Efeito de segurança: Valida se existe um contexto de empresa ou dados de navegação.
     */
    useEffect(() => {
        if (!currentCompany && !location.state?.email) {
            // Nota: Se a sessão expirou, podemos redirecionar ou aguardar o AuthContext resolver
        }
    }, [currentCompany, location.state, navigate]);

    /**
     * Simula o processamento num Gateway de Pagamento e atualiza o estado no backend.
     */
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
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=payment`);

            // 3. Sucesso!
            setIsSuccess(true);
            toast.success("Pagamento confirmado!", {
                description: "Sua assinatura foi ativada com sucesso."
            });

            // 4. Redireciona para o Dashboard após tempo de leitura
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

    // RENDERIZAÇÃO CONDICIONAL: Ecrã de Sucesso
    if (isSuccess) {
        return <PaymentSuccess legalName={legalName} />;
    }

    // RENDERIZAÇÃO: Ecrã de Checkout
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">

                {/* LADO ESQUERDO: Resumo do Pedido (Componente Estático) */}
                <OrderSummary />

                {/* LADO DIREITO: Formulário de Pagamento (Isolado para futura integração) */}
                <MockPaymentForm
                    responsibleName={responsibleName}
                    isProcessing={isProcessing}
                    onPayment={handlePayment}
                />

            </div>
        </div>
    );
}