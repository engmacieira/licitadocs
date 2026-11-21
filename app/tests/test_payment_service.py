import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.models.payment_model import PaymentEvent
from app.services.payment_service import PaymentService


@pytest.mark.asyncio
async def test_create_checkout_sandbox(db_session, test_company):
    with patch.object(settings, "INFINITEPAY_ENABLED", False), \
         patch.object(settings, "INFINITEPAY_HANDLE", None), \
         patch.object(settings, "ENV", "development"), \
         patch.object(settings, "FRONTEND_URL", "http://localhost:5173"):
        result = await PaymentService.create_checkout(
            db=db_session,
            company_id=test_company.id,
            plan="PRO",
            billing_cycle="annual",
        )

    assert result.mode == "sandbox"
    assert result.status == "pending"
    assert result.order_nsu.startswith(f"licita-{test_company.id[:8]}-")
    assert f"order_nsu={result.order_nsu}" in result.checkout_url

    event = (
        db_session.query(PaymentEvent)
        .filter(PaymentEvent.order_nsu == result.order_nsu)
        .first()
    )
    assert event is not None
    assert event.event_type == "checkout_created"
    assert event.idempotency_key == f"checkout:{result.order_nsu}"


@pytest.mark.asyncio
async def test_create_checkout_production_without_config_raises_503(db_session, test_company):
    with patch.object(settings, "INFINITEPAY_ENABLED", False), \
         patch.object(settings, "INFINITEPAY_HANDLE", None), \
         patch.object(settings, "ENV", "production"):
        with pytest.raises(HTTPException) as exc_info:
            await PaymentService.create_checkout(
                db=db_session,
                company_id=test_company.id,
            )
    assert exc_info.value.status_code == 503


@pytest.mark.asyncio
async def test_create_checkout_infinitepay_http_mock(db_session, test_company):
    mock_response = MagicMock()
    mock_response.json.return_value = {"url": "https://checkout.infinitepay.io/pay/abc123"}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.return_value = mock_response

    with patch.object(settings, "INFINITEPAY_ENABLED", True), \
         patch.object(settings, "INFINITEPAY_HANDLE", "licitadocs-handle"), \
         patch.object(settings, "INFINITEPAY_API_KEY", "test-api-key"), \
         patch.object(settings, "INFINITEPAY_API_URL", "https://api.infinitepay.io"), \
         patch("app.services.payment_service.httpx.AsyncClient", return_value=mock_client):
        result = await PaymentService.create_checkout(
            db=db_session,
            company_id=test_company.id,
            plan="PRO",
            billing_cycle="annual",
        )

    assert result.mode == "infinitepay"
    assert result.checkout_url == "https://checkout.infinitepay.io/pay/abc123"
    mock_client.post.assert_awaited_once()


def test_verify_webhook_signature_variants():
    raw_body = b'{"order_nsu":"licita-123","status":"paid"}'
    secret = "super-secret-webhook"

    expected_hex = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    with patch.object(settings, "INFINITEPAY_WEBHOOK_SECRET", secret):
        assert PaymentService.verify_webhook_signature(raw_body, {"X-InfinitePay-Signature": expected_hex}) is True
        assert PaymentService.verify_webhook_signature(raw_body, {"X-InfinitePay-Signature": f"sha256={expected_hex}"}) is True
        assert PaymentService.verify_webhook_signature(raw_body, {"X-Webhook-Secret": secret}) is True
        assert PaymentService.verify_webhook_signature(raw_body, {"Authorization": f"Bearer {secret}"}) is True
        assert PaymentService.verify_webhook_signature(raw_body, {"X-InfinitePay-Signature": "invalid"}) is False
        assert PaymentService.verify_webhook_signature(raw_body, {}) is False

    with patch.object(settings, "INFINITEPAY_WEBHOOK_SECRET", None):
        with patch.object(settings, "ENV", "development"):
            assert PaymentService.verify_webhook_signature(raw_body, {}) is True
        with patch.object(settings, "ENV", "production"):
            assert PaymentService.verify_webhook_signature(raw_body, {}) is False


@pytest.mark.asyncio
async def test_webhook_activation_renewal_deactivation_and_idempotency(db_session, test_company):
    with patch.object(settings, "INFINITEPAY_ENABLED", False), \
         patch.object(settings, "ENV", "development"):
        checkout = await PaymentService.create_checkout(
            db=db_session,
            company_id=test_company.id,
            plan="PRO",
            billing_cycle="annual",
        )

    # 1. Activation
    paid_payload = {
        "id": "evt-001",
        "order_nsu": checkout.order_nsu,
        "transaction_nsu": "tx-001",
        "status": "paid",
        "paid_amount": 199000,
    }
    res1 = PaymentService.process_webhook(
        db=db_session,
        payload_dict=paid_payload,
        raw_body=json.dumps(paid_payload).encode("utf-8"),
    )
    assert res1["status"] == "processed"
    assert res1["idempotent"] is False

    db_session.refresh(test_company)
    assert test_company.is_payment_active is True
    assert test_company.subscription_status == "active"
    assert test_company.last_payment_at is not None
    first_period_end = test_company.subscription_current_period_end
    assert first_period_end is not None

    # 2. Idempotency (same event again)
    res_dup = PaymentService.process_webhook(
        db=db_session,
        payload_dict=paid_payload,
        raw_body=json.dumps(paid_payload).encode("utf-8"),
    )
    assert res_dup == {"status": "already_processed", "idempotent": True}
    db_session.refresh(test_company)
    assert test_company.subscription_current_period_end == first_period_end
    assert db_session.query(PaymentEvent).filter(PaymentEvent.idempotency_key == "webhook:evt-001").count() == 1

    # 3. Renewal extends period end
    renew_payload = {
        "id": "evt-002",
        "order_nsu": checkout.order_nsu,
        "transaction_nsu": "tx-002",
        "event_type": "subscription.renewed",
        "status": "approved",
        "paid_amount": 199000,
    }
    PaymentService.process_webhook(
        db=db_session,
        payload_dict=renew_payload,
        raw_body=json.dumps(renew_payload).encode("utf-8"),
    )
    db_session.refresh(test_company)
    assert test_company.is_payment_active is True
    assert test_company.subscription_current_period_end > first_period_end + timedelta(days=300)

    # 4. Pending event does not deactivate or activate
    pending_payload = {
        "id": "evt-003",
        "order_nsu": checkout.order_nsu,
        "status": "pending",
    }
    PaymentService.process_webhook(
        db=db_session,
        payload_dict=pending_payload,
        raw_body=json.dumps(pending_payload).encode("utf-8"),
    )
    db_session.refresh(test_company)
    assert test_company.is_payment_active is True

    # 5. Cancellation / Past due deactivates
    cancel_payload = {
        "id": "evt-004",
        "order_nsu": checkout.order_nsu,
        "event_type": "subscription.canceled",
        "status": "canceled",
    }
    PaymentService.process_webhook(
        db=db_session,
        payload_dict=cancel_payload,
        raw_body=json.dumps(cancel_payload).encode("utf-8"),
    )
    db_session.refresh(test_company)
    assert test_company.is_payment_active is False
    assert test_company.subscription_status == "canceled"

    # 6. Past due
    past_due_payload = {
        "id": "evt-005",
        "order_nsu": checkout.order_nsu,
        "status": "past_due",
    }
    PaymentService.process_webhook(
        db=db_session,
        payload_dict=past_due_payload,
        raw_body=json.dumps(past_due_payload).encode("utf-8"),
    )
    db_session.refresh(test_company)
    assert test_company.is_payment_active is False
    assert test_company.subscription_status == "past_due"
