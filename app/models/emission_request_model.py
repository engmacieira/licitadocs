from sqlalchemy import Column, String, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class EmissionRequest(Base):
    __tablename__ = "emission_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    emission_rule_id = Column(String, ForeignKey("emission_rules.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    requested_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    status = Column(String, default="pending") # "pending" ou "completed"
    estimated_date = Column(Date, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())