"""
Modelagem de Eventos de Pagamento e Auditoria (Infinite Pay).
Registra checkouts criados e eventos de webhook com garantia de idempotência.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid


class PaymentEvent(Base):
    """
    Tabela de auditoria e idempotência para transações e webhooks de pagamento.
    """
    __tablename__ = "payment_events"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    company_id = Column(String, ForeignKey("companies.id"), index=True, nullable=True)
    order_nsu = Column(String, index=True, nullable=True)
    transaction_nsu = Column(String, index=True, nullable=True)
    idempotency_key = Column(String, unique=True, nullable=False)
    event_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=True)
    checkout_url = Column(Text, nullable=True)
    raw_payload = Column(Text, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("app.models.company_model.Company", foreign_keys=[company_id])
