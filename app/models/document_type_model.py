"""
Modelagem de Tipos de Documentos (Catálogo).
Define quais documentos o sistema aceita e suas regras (Ex: Contrato Social, CND).
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_uuid

class DocumentType(Base):
    __tablename__ = "document_types"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    category_id = Column(String, ForeignKey("document_categories.id"), nullable=False)
    
    # Ex: "Contrato Social"
    name = Column(String, nullable=False)
    
    # Ex: "contrato_social"
    slug = Column(String, unique=True, index=True, nullable=False)
    
    # Validade padrão sugerida em dias (Ex: 180 para CNDs, 0 para permanentes)
    validity_days_default = Column(Integer, default=0)
    
    # Instruções para o usuário (Markdown ou Texto simples)
    description = Column(Text, nullable=True)

    # Relacionamentos
    category = relationship("DocumentCategory", back_populates="types")
    certificates = relationship("app.models.certificate_model.Certificate", back_populates="document_type")