from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import date
from app.core.database import Base

class AIUsage(Base):
    """
    Modelo de registro do consumo diário de tokens de IA por empresa.
    Para atender aos requisitos de Financial DoS / cota diária de 30.000 tokens.
    """
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_date = Column(Date, default=date.today, nullable=False, index=True)
    tokens_consumed = Column(Integer, default=0, nullable=False)

    # Garantimos que haverá apenas 1 registro por (company_id, usage_date) 
    # pois a agregação é diária.
    __table_args__ = (
        UniqueConstraint("company_id", "usage_date", name="uix_company_date_usage"),
    )

    company = relationship("Company")
