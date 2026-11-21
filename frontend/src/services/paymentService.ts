import api from './api';
import type {
    CheckoutCreatePayload,
    CheckoutResponse,
    PaymentStatusResponse,
} from '../types';

/**
 * Serviço responsável pela integração de pagamentos (Infinite Pay)
 * e consulta do estado da assinatura da empresa.
 */
export const paymentService = {
    /**
     * Cria uma sessão de checkout para ativação ou renovação de assinatura.
     * @param {CheckoutCreatePayload} payload - Dados da empresa, plano e ciclo de cobrança.
     * @returns {Promise<CheckoutResponse>} URL de checkout e metadados do pedido.
     */
    createCheckout: async (payload: CheckoutCreatePayload): Promise<CheckoutResponse> => {
        const { data } = await api.post<CheckoutResponse>('/payments/checkout', payload);
        return data;
    },

    /**
     * Consulta o estado atual de pagamento e assinatura de uma empresa.
     * @param {string} companyId - ID da empresa.
     * @returns {Promise<PaymentStatusResponse>} Estado de ativação e assinatura.
     */
    getStatus: async (companyId: string): Promise<PaymentStatusResponse> => {
        const { data } = await api.get<PaymentStatusResponse>(`/payments/status/${companyId}`);
        return data;
    },
};
