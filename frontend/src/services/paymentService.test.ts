import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from './paymentService';
import api from './api';
import type { CheckoutCreatePayload, CheckoutResponse, PaymentStatusResponse } from '../types';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

describe('paymentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createCheckout should call api.post with /payments/checkout and return response data', async () => {
        const payload: CheckoutCreatePayload = {
            company_id: 'comp-123',
            plan: 'PRO',
            billing_cycle: 'annual',
        };
        const mockResponse: CheckoutResponse = {
            checkout_url: 'https://checkout.infinitepay.io/invoice/abc',
            order_nsu: 'licita-comp-123-xyz',
            status: 'pending',
            mode: 'infinitepay',
        };
        vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

        const result = await paymentService.createCheckout(payload);

        expect(api.post).toHaveBeenCalledWith('/payments/checkout', payload);
        expect(result).toEqual(mockResponse);
    });

    it('createCheckout should propagate API errors', async () => {
        vi.mocked(api.post).mockRejectedValueOnce(new Error('Checkout failed'));

        await expect(
            paymentService.createCheckout({ company_id: 'comp-123' })
        ).rejects.toThrow('Checkout failed');
    });

    it('getStatus should call api.get with /payments/status/:companyId and return status', async () => {
        const mockStatus: PaymentStatusResponse = {
            company_id: 'comp-123',
            is_payment_active: true,
            subscription_status: 'active',
            subscription_plan: 'PRO',
            subscription_current_period_end: '2027-11-20T00:00:00Z',
            last_payment_at: '2026-11-20T22:00:00Z',
        };
        vi.mocked(api.get).mockResolvedValueOnce({ data: mockStatus });

        const result = await paymentService.getStatus('comp-123');

        expect(api.get).toHaveBeenCalledWith('/payments/status/comp-123');
        expect(result).toEqual(mockStatus);
    });

    it('getStatus should propagate API errors', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('Status fetch failed'));

        await expect(paymentService.getStatus('comp-123')).rejects.toThrow('Status fetch failed');
    });
});
