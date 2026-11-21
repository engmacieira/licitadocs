"""
Repositório de Pagamentos e Eventos Infinite Pay.
Gerencia persistência de eventos (idempotência/auditoria) e atualização de assinatura da empresa.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.repositories.base_repository import BaseRepository
from app.models.payment_model import PaymentEvent
from app.models.company_model import Company


class PaymentRepository(BaseRepository[PaymentEvent]):
    model = PaymentEvent

    @classmethod
    def get_by_idempotency_key(cls, db: Session, idempotency_key: str) -> Optional[PaymentEvent]:
        """Busca evento de pagamento pela chave única de idempotência."""
        return (
            db.query(cls.model)
            .filter(cls.model.idempotency_key == idempotency_key)
            .first()
        )

    @classmethod
    def get_by_order_nsu(cls, db: Session, order_nsu: str) -> Optional[PaymentEvent]:
        """Busca o evento mais recente vinculado a um order_nsu."""
        return (
            db.query(cls.model)
            .filter(cls.model.order_nsu == order_nsu)
            .order_by(cls.model.created_at.desc())
            .first()
        )

    @classmethod
    def create_event(
        cls,
        db: Session,
        idempotency_key: str,
        event_type: str,
        status: str,
        company_id: Optional[str] = None,
        order_nsu: Optional[str] = None,
        transaction_nsu: Optional[str] = None,
        amount_cents: Optional[int] = None,
        checkout_url: Optional[str] = None,
        raw_payload: Optional[str] = None,
        processed_at: Optional[datetime] = None,
    ) -> PaymentEvent:
        """Cria e persiste um novo evento de pagamento."""
        event = cls.model(
            company_id=company_id,
            order_nsu=order_nsu,
            transaction_nsu=transaction_nsu,
            idempotency_key=idempotency_key,
            event_type=event_type,
            status=status,
            amount_cents=amount_cents,
            checkout_url=checkout_url,
            raw_payload=raw_payload,
            processed_at=processed_at,
        )
        try:
            db.add(event)
            db.commit()
            db.refresh(event)
            return event
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao registrar evento de pagamento: {str(e)}")

    @classmethod
    def get_company_by_external_id(cls, db: Session, external_id: str) -> Optional[Company]:
        """Busca empresa ativa pelo subscription_external_id."""
        return (
            db.query(Company)
            .filter(
                Company.subscription_external_id == external_id,
                Company.deleted_at.is_(None),
            )
            .first()
        )

    @classmethod
    def update_company_subscription(
        cls,
        db: Session,
        company: Company,
        *,
        is_payment_active: Optional[bool] = None,
        subscription_status: Optional[str] = None,
        subscription_plan: Optional[str] = None,
        subscription_external_id: Optional[str] = None,
        subscription_current_period_end: Optional[datetime] = None,
        last_payment_at: Optional[datetime] = None,
    ) -> Company:
        """Atualiza os campos de assinatura e status de pagamento da empresa."""
        if is_payment_active is not None:
            company.is_payment_active = is_payment_active
        if subscription_status is not None:
            company.subscription_status = subscription_status
        if subscription_plan is not None:
            company.subscription_plan = subscription_plan
        if subscription_external_id is not None:
            company.subscription_external_id = subscription_external_id
        if subscription_current_period_end is not None:
            company.subscription_current_period_end = subscription_current_period_end
        if last_payment_at is not None:
            company.last_payment_at = last_payment_at

        try:
            db.commit()
            db.refresh(company)
            return company
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro ao atualizar assinatura da empresa: {str(e)}")
