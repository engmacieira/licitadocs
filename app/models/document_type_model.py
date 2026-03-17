"""
Modelagem de Tipos de Documentos (Catálogo).
Define quais documentos o sistema aceita e suas regras (Ex: Contrato Social, CND).
"""
import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_uuid

class DocumentScope(str, enum.Enum):
    NATIONAL = "NATIONAL"
    STATE = "STATE"
    MUNICIPAL = "MUNICIPAL"

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

    scope = Column(
        SQLEnum(DocumentScope, native_enum=False, length=50), 
        server_default=DocumentScope.NATIONAL.value,  
        default=DocumentScope.NATIONAL, 
        nullable=False
    )

    automation_config = relationship(
        "app.models.document_automation_model.DocumentAutomationConfig", 
        back_populates="document_type", 
        uselist=False, 
        cascade="all, delete-orphan"
    )