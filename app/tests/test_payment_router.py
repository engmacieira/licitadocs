import hashlib
import hmac
import json
from unittest.mock import patch

from app.core.config import settings
from app.models.user_model import UserCompanyLink, UserCompanyRole


def test_checkout_and_status_requires_auth_and_master_role(
    client, db_session, test_user, test_company, auth_headers
):
    # Unauthenticated
    unauth = client.post(
        "/payments/checkout",
        json={"company_id": test_company.id, "plan": "PRO", "billing_cycle": "annual"},
    )
    assert unauth.status_code == 401

    # Authenticated MASTER creates checkout
    with patch.object(settings, "INFINITEPAY_ENABLED", False), \
         patch.object(settings, "ENV", "development"):
        res = client.post(
            "/payments/checkout",
            json={"company_id": test_company.id, "plan": "PRO", "billing_cycle": "annual"},
            headers=auth_headers,
        )
    assert res.status_code == 200
    body = res.json()
    assert body["mode"] == "sandbox"
    assert body["status"] == "pending"
    assert "order_nsu" in body

    # Status endpoint
    status_res = client.get(f"/payments/status/{test_company.id}", headers=auth_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["company_id"] == test_company.id
    assert status_data["is_payment_active"] is False

    # Downgrade user to VIEWER -> checkout must return 403, status remains 200
    link = (
        db_session.query(UserCompanyLink)
        .filter(
            UserCompanyLink.user_id == test_user.id,
            UserCompanyLink.company_id == test_company.id,
        )
        .first()
    )
    link.role = UserCompanyRole.VIEWER.value
    db_session.commit()

    forbidden = client.post(
        "/payments/checkout",
        json={"company_id": test_company.id, "plan": "PRO", "billing_cycle": "annual"},
        headers=auth_headers,
    )
    assert forbidden.status_code == 403

    viewer_status = client.get(f"/payments/status/{test_company.id}", headers=auth_headers)
    assert viewer_status.status_code == 200


def test_webhook_endpoint_signature_and_idempotency(
    client, test_company, auth_headers
):
    with patch.object(settings, "INFINITEPAY_ENABLED", False), \
         patch.object(settings, "ENV", "development"):
        checkout_res = client.post(
            "/payments/checkout",
            json={"company_id": test_company.id, "plan": "PRO", "billing_cycle": "annual"},
            headers=auth_headers,
        )
    assert checkout_res.status_code == 200
    order_nsu = checkout_res.json()["order_nsu"]

    secret = "router-webhook-secret"
    payload = {
        "id": "wh-evt-100",
        "order_nsu": order_nsu,
        "transaction_nsu": "tx-100",
        "status": "paid",
        "paid_amount": 199000,
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    valid_sig = hmac.new(secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    with patch.object(settings, "INFINITEPAY_WEBHOOK_SECRET", secret):
        # Missing signature -> 401
        missing_res = client.post(
            "/payments/webhook/infinitepay",
            content=raw_bytes,
            headers={"Content-Type": "application/json"},
        )
        assert missing_res.status_code == 401

        # Invalid signature -> 401
        invalid_res = client.post(
            "/payments/webhook/infinitepay",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "X-InfinitePay-Signature": "wrong-signature",
            },
        )
        assert invalid_res.status_code == 401

        # Valid signature -> 200 & activates
        ok_res = client.post(
            "/payments/webhook/infinitepay",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "X-InfinitePay-Signature": f"sha256={valid_sig}",
            },
        )
        assert ok_res.status_code == 200
        assert ok_res.json()["status"] == "processed"
        assert ok_res.json()["is_payment_active"] is True

        # Duplicate -> 200 idempotent
        dup_res = client.post(
            "/payments/webhook/infinitepay",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "X-InfinitePay-Signature": valid_sig,
            },
        )
        assert dup_res.status_code == 200
        assert dup_res.json() == {"status": "already_processed", "idempotent": True}

    status_res = client.get(f"/payments/status/{test_company.id}", headers=auth_headers)
    assert status_res.status_code == 200
    assert status_res.json()["is_payment_active"] is True
    assert status_res.json()["subscription_status"] == "active"
