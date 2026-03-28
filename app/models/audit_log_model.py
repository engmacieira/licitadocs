from sqlalchemy import Column, String, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import declarative_mixin
import uuid

from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    entity_name = Column(String, index=True, nullable=False)
    entity_id = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    user_id = Column(String, nullable=True, index=True)

    # Suporte para PostgreSQL JSONB e fallback genérico para JSON
    old_payload = Column(JSONB().with_variant(JSON(), 'sqlite'), nullable=True)
    new_payload = Column(JSONB().with_variant(JSON(), 'sqlite'), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    request_id = Column(String, index=True, nullable=True)
