"""
Modelagem do Motor de Regras de Emissão (Diretórios).
Responsável por armazenar contatos manuais e links cruzando Tipo de Documento x Localização.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class EmissionRule(Base):
    __tablename__ = "emission_rules"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Qual documento esta regra ensina a emitir? (Ex: CND Municipal)
    document_type_id = Column(String, ForeignKey("document_types.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Localização (Se for Nacional, ambos ficam nulos. Se Estadual, só city fica nulo)
    state = Column(String(2), nullable=True, index=True) # Ex: SP, RJ
    city = Column(String, nullable=True, index=True)  # Ex: São Paulo, Campinas
    
    # Hiperlink dinâmico para o portal
    emission_link = Column(String, nullable=True)
    
    # Contatos para solicitação manual (caso não tenha portal)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_whatsapp = Column(String, nullable=True)
    
    # Campo livre para a equipe de operação (Ex: "A prefeitura só atende de terça e quinta")
    operation_notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamento para o SQLAlchemy trazer os dados do tipo quando necessário
    document_type = relationship("DocumentType")