"""
Serviço de Pagamentos e Gestão de Assinaturas (Infinite Pay).
Implementa criação de checkout (sandbox e produção), validação de assinatura de webhook,
processamento idempotente de eventos e atualização de recorrência da empresa.
"""

import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.company_repository import CompanyRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment_schemas import CheckoutCreateResponse, PaymentStatusResponse

PLAN_PRICING_CENTS: Dict[str, Dict[str, int]] = {
    "PRO": {
        "monthly": 19900,
        "annual": 199000,
    },
    "ENTERPRISE": {
        "monthly": 49900,
        "annual": 499000,
    },
}

ACTIVATION_STATUSES = {
    "paid",
    "approved",
    "confirmed",
    "active",
    "payment.approved",
    "subscription.renewed",
    "subscription.activated",
}

DEACTIVATION_STATUS_MAP = {
    "canceled": "canceled",
    "cancelled": "canceled",
    "subscription.canceled": "canceled",
    "expired": "expired",
    "subscription.expired": "expired",
    "refunded": "refunded",
    "chargeback": "refunded",
    "past_due": "past_due",
    "unpaid": "past_due",
    "failed": "past_due",
    "payment.failed": "past_due",
}

PENDING_STATUSES = {
    "pending",
    "processing",
    "created",
    "waiting_payment",
}


class PaymentService:
    """Orquestrador de pagamentos Infinite Pay e ciclo de vida de assinaturas."""

    @staticmethod
    def _get_amount_cents(plan: str, billing_cycle: str) -> int:
        plan_key = (plan or "PRO").upper()
        cycle_key = (billing_cycle or "annual").lower()
        plan_prices = PLAN_PRICING_CENTS.get(plan_key, PLAN_PRICING_CENTS["PRO"])
        return plan_prices.get(cycle_key, plan_prices["annual"])

    @staticmethod
    def _normalize_headers(headers: Dict[str, str]) -> Dict[str, str]:
        return {str(k).lower(): str(v) for k, v in headers.items()}

    @classmethod
    async def create_checkout(
        cls,
        db: Session,
        company_id: str,
        plan: str = "PRO",
        billing_cycle: str = "annual",
    ) -> CheckoutCreateResponse:
        """
        Gera um link de checkout (Infinite Pay real ou sandbox local) e registra
        o evento inicial para rastreamento e idempotência.
        """
        company = CompanyRepository.get_by_id(db, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada.",
            )

        order_nsu = f"licita-{company_id[:8]}-{uuid4().hex[:12]}"
        amount_cents = cls._get_amount_cents(plan, billing_cycle)
        frontend_base = (settings.FRONTEND_URL or "").rstrip("/")

        if settings.INFINITEPAY_ENABLED and settings.INFINITEPAY_HANDLE:
            redirect_url = settings.INFINITEPAY_REDIRECT_URL or f"{frontend_base}/payment/success"
            payload: Dict[str, Any] = {
                "handle": settings.INFINITEPAY_HANDLE,
                "items": [
                    {
                        "quantity": 1,
                        "price": amount_cents,
                        "description": f"LicitaDocs {plan.upper()} ({billing_cycle})",
                    }
                ],
                "order_nsu": order_nsu,
                "redirect_url": redirect_url,
            }
            if settings.INFINITEPAY_WEBHOOK_URL:
                payload["webhook_url"] = settings.INFINITEPAY_WEBHOOK_URL

            headers: Dict[str, str] = {"Content-Type": "application/json"}
            if settings.INFINITEPAY_API_KEY:
                headers["Authorization"] = f"Bearer {settings.INFINITEPAY_API_KEY}"

            api_base = (settings.INFINITEPAY_API_URL or "https://api.infinitepay.io").rstrip("/")
            endpoint = f"{api_base}/invoices/public/checkout/links"

            try:
                async with httpx.AsyncClient(timeout=settings.INFINITEPAY_TIMEOUT_SECONDS) as client:
                    response = await client.post(endpoint, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()
            except httpx.HTTPError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Erro ao comunicar com Infinite Pay: {str(exc)}",
                ) from exc

            checkout_url = data.get("url") or data.get("checkout_url") or data.get("link")
            if not checkout_url:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Infinite Pay não retornou URL de checkout.",
                )
            mode = "infinitepay"
        else:
            if settings.ENV.lower() == "production":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Integração Infinite Pay não configurada em produção.",
                )
            checkout_url = f"{frontend_base}/payment/success?order_nsu={order_nsu}&mode=sandbox"
            mode = "sandbox"

        PaymentRepository.create_event(
            db=db,
            company_id=company.id,
            order_nsu=order_nsu,
            idempotency_key=f"checkout:{order_nsu}",
            event_type="checkout_created",
            status="pending",
            amount_cents=amount_cents,
            checkout_url=checkout_url,
            raw_payload=json.dumps(
                {
                    "company_id": company.id,
                    "plan": plan,
                    "billing_cycle": billing_cycle,
                    "order_nsu": order_nsu,
                    "mode": mode,
                }
            ),
        )

        PaymentRepository.update_company_subscription(
            db,
            company,
            subscription_plan=plan,
            subscription_external_id=order_nsu,
        )

        return CheckoutCreateResponse(
            checkout_url=checkout_url,
            order_nsu=order_nsu,
            status="pending",
            mode=mode,
        )

    @classmethod
    def verify_webhook_signature(cls, raw_body: bytes, headers: Dict[str, str]) -> bool:
        """
        Valida a autenticidade do webhook recebido da Infinite Pay.
        Aceita HMAC-SHA256 em X-InfinitePay-Signature ou segredo direto em
        X-Webhook-Secret / Authorization: Bearer <secret>.
        """
        secret = settings.INFINITEPAY_WEBHOOK_SECRET
        if not secret:
            return settings.ENV.lower() != "production"

        normalized = cls._normalize_headers(headers)

        signature_header = normalized.get("x-infinitepay-signature")
        if signature_header:
            candidate = signature_header.strip()
            if candidate.lower().startswith("sha256="):
                candidate = candidate[7:]
            expected = hmac.new(
                secret.encode("utf-8"),
                raw_body,
                hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(candidate.lower(), expected.lower())

        webhook_secret_header = normalized.get("x-webhook-secret")
        if webhook_secret_header:
            return hmac.compare_digest(webhook_secret_header.strip(), secret)

        auth_header = normalized.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()
            return hmac.compare_digest(token, secret)

        return False

    @classmethod
    def get_payment_status(cls, db: Session, company_id: str) -> PaymentStatusResponse:
        """Retorna o status consolidado da assinatura de uma empresa."""
        company = CompanyRepository.get_by_id(db, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada.",
            )

        return PaymentStatusResponse(
            company_id=company.id,
            is_payment_active=bool(company.is_payment_active),
            subscription_status=company.subscription_status or "pending",
            subscription_plan=company.subscription_plan,
            subscription_current_period_end=company.subscription_current_period_end,
            last_payment_at=company.last_payment_at,
        )

    @classmethod
    def process_webhook(
        cls,
        db: Session,
        payload_dict: Dict[str, Any],
        raw_body: bytes,
    ) -> Dict[str, Any]:
        """
        Processa evento de webhook da Infinite Pay de forma idempotente,
        atualizando o estado de assinatura da empresa correspondente.
        """
        order_nsu: Optional[str] = payload_dict.get("order_nsu")
        transaction_nsu: Optional[str] = payload_dict.get("transaction_nsu")
        raw_event = payload_dict.get("event_type") or payload_dict.get("event")
        raw_status = payload_dict.get("status")

        normalized_status = str(raw_status or raw_event or "unknown").strip().lower()
        event_type = str(raw_event or normalized_status).strip().lower()

        event_id = payload_dict.get("id")
        if event_id is not None and str(event_id).strip():
            idempotency_key = f"webhook:{str(event_id).strip()}"
        else:
            idempotency_key = f"webhook:{order_nsu or ''}:{transaction_nsu or ''}:{normalized_status}"

        existing = PaymentRepository.get_by_idempotency_key(db, idempotency_key)
        if existing:
            return {"status": "already_processed", "idempotent": True}

        company = None
        payload_company_id = payload_dict.get("company_id")
        if payload_company_id:
            company = CompanyRepository.get_by_id(db, str(payload_company_id))

        if not company and order_nsu:
            prior_event = PaymentRepository.get_by_order_nsu(db, order_nsu)
            if prior_event and prior_event.company_id:
                company = CompanyRepository.get_by_id(db, prior_event.company_id)

        if not company and order_nsu:
            company = PaymentRepository.get_company_by_external_id(db, order_nsu)

        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada para o evento de pagamento.",
            )

        now = datetime.now(timezone.utc)
        amount_cents = payload_dict.get("paid_amount") or payload_dict.get("amount")
        raw_payload_text = raw_body.decode("utf-8", errors="replace") if raw_body else json.dumps(payload_dict)

        new_is_active: Optional[bool] = None
        new_sub_status: Optional[str] = None
        new_period_end: Optional[datetime] = None
        new_last_payment_at: Optional[datetime] = None

        if normalized_status in ACTIVATION_STATUSES or event_type in ACTIVATION_STATUSES:
            new_is_active = True
            new_sub_status = "active"
            new_last_payment_at = now
            current_end = company.subscription_current_period_end
            if current_end and current_end.tzinfo is None:
                current_end = current_end.replace(tzinfo=timezone.utc)
            base_date = current_end if (current_end and current_end > now) else now
            billing_cycle = str(payload_dict.get("billing_cycle") or "annual").lower()
            period_days = 30 if billing_cycle == "monthly" else 365
            new_period_end = base_date + timedelta(days=period_days)
        elif normalized_status in DEACTIVATION_STATUS_MAP or event_type in DEACTIVATION_STATUS_MAP:
            new_is_active = False
            new_sub_status = (
                DEACTIVATION_STATUS_MAP.get(normalized_status)
                or DEACTIVATION_STATUS_MAP.get(event_type)
                or "canceled"
            )
        elif normalized_status in PENDING_STATUSES:
            new_sub_status = company.subscription_status or "pending"

        PaymentRepository.create_event(
            db=db,
            company_id=company.id,
            order_nsu=order_nsu,
            transaction_nsu=transaction_nsu,
            idempotency_key=idempotency_key,
            event_type=event_type,
            status=normalized_status,
            amount_cents=int(amount_cents) if amount_cents is not None else None,
            raw_payload=raw_payload_text,
            processed_at=now,
        )

        if new_is_active is not None or new_sub_status is not None:
            PaymentRepository.update_company_subscription(
                db,
                company,
                is_payment_active=new_is_active,
                subscription_status=new_sub_status,
                subscription_external_id=order_nsu or company.subscription_external_id,
                subscription_current_period_end=new_period_end,
                last_payment_at=new_last_payment_at,
            )

        return {
            "status": "processed",
            "idempotent": False,
            "company_id": company.id,
            "subscription_status": company.subscription_status,
            "is_payment_active": company.is_payment_active,
        }
