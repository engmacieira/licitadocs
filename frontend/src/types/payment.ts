/** Payload para criação de sessão de checkout no gateway Infinite Pay. */
export interface CheckoutCreatePayload {
    company_id: string;
    plan?: string;
    billing_cycle?: string;
}

/** Resposta retornada pela API ao criar uma sessão de checkout. */
export interface CheckoutResponse {
    checkout_url: string;
    order_nsu: string;
    status: string;
    mode: 'infinitepay' | 'sandbox' | string;
}

/** Estado atual do pagamento e da assinatura de uma empresa. */
export interface PaymentStatusResponse {
    company_id: string;
    is_payment_active: boolean;
    subscription_status: string;
    subscription_plan?: string | null;
    subscription_current_period_end?: string | null;
    last_payment_at?: string | null;
}
