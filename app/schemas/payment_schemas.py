"""
Schemas Pydantic para Integração Infinite Pay e Gestão de Assinaturas.
"""

from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict


class CheckoutCreateRequest(BaseModel):
    """Requisição para geração de link de checkout."""
    company_id: str
    plan: str = "PRO"
    billing_cycle: str = "annual"


class CheckoutCreateResponse(BaseModel):
    """Resposta da geração de link de checkout."""
    checkout_url: str
    order_nsu: str
    status: str
    mode: str


class PaymentStatusResponse(BaseModel):
    """Status atual da assinatura e pagamento da empresa."""
    company_id: str
    is_payment_active: bool
    subscription_status: str
    subscription_plan: Optional[str] = None
    subscription_current_period_end: Optional[datetime] = None
    last_payment_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InfinitePayWebhookPayload(BaseModel):
    """Payload flexível recebido via webhook da Infinite Pay."""
    order_nsu: Optional[str] = None
    transaction_nsu: Optional[str] = None
    invoice_slug: Optional[str] = None
    slug: Optional[str] = None
    event: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[int] = None
    paid_amount: Optional[int] = None
    capture_method: Optional[str] = None
    receipt_url: Optional[str] = None
    company_id: Optional[str] = None
    id: Optional[Union[str, int]] = None
    expires_at: Optional[Union[str, datetime]] = None

    model_config = ConfigDict(extra="allow")
