"""
Router de Pagamentos e Assinaturas (Infinite Pay).
Expõe endpoints para criação de checkout, consulta de status e recepção de webhooks.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, verify_company_access
from app.models.user_model import User, UserCompanyRole
from app.schemas.payment_schemas import (
    CheckoutCreateRequest,
    CheckoutCreateResponse,
    InfinitePayWebhookPayload,
    PaymentStatusResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Pagamentos e Assinaturas"])


@router.post(
    "/checkout",
    response_model=CheckoutCreateResponse,
    summary="Criar Link de Checkout",
)
async def create_checkout(
    payload: CheckoutCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Gera link de checkout para ativação ou renovação da assinatura da empresa.
    Requer vínculo MASTER na empresa ou perfil ADMIN.
    """
    verify_company_access(
        payload.company_id,
        current_user,
        db,
        required_role=UserCompanyRole.MASTER.value,
    )
    return await PaymentService.create_checkout(
        db=db,
        company_id=payload.company_id,
        plan=payload.plan,
        billing_cycle=payload.billing_cycle,
    )


@router.get(
    "/status/{company_id}",
    response_model=PaymentStatusResponse,
    summary="Consultar Status da Assinatura",
)
def get_payment_status(
    company_id: str = Path(..., description="ID da empresa"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retorna o status atual de pagamento e recorrência da empresa.
    """
    verify_company_access(company_id, current_user, db)
    return PaymentService.get_payment_status(db=db, company_id=company_id)


@router.post(
    "/webhook/infinitepay",
    status_code=status.HTTP_200_OK,
    summary="Webhook Infinite Pay",
)
async def infinitepay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Endpoint público para recepção de notificações de pagamento da Infinite Pay.
    Valida assinatura/segredo e garante processamento idempotente.
    """
    raw_body = await request.body()
    headers = dict(request.headers)

    if not PaymentService.verify_webhook_signature(raw_body, headers):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Assinatura de webhook inválida.",
        )

    try:
        payload_dict = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload JSON inválido.",
        ) from exc

    validated = InfinitePayWebhookPayload.model_validate(payload_dict)
    return PaymentService.process_webhook(
        db=db,
        payload_dict=validated.model_dump(),
        raw_body=raw_body,
    )
