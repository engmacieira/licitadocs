"""
Modelagem de Tipos de Documentos (Catálogo).
Define as regras específicas para cada tipo de certidão ou documento aceito.
Estabelece a validade padrão, escopo geográfico e vínculos de automação.
"""

import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class DocumentScope(str, enum.Enum):
    """Define a abrangência territorial do documento."""
    NATIONAL = "NATIONAL"   # Ex: CND Federal
    STATE = "STATE"         # Ex: CND Estadual (ICMS)
    MUNICIPAL = "MUNICIPAL" # Ex: CND Municipal (ISS)

class DocumentType(Base, SoftDeleteMixin):
    """
    Representa uma definição técnica de documento no catálogo do sistema.
    Funciona como o 'Template' para a criação de Certificados.
    """
    __tablename__ = "document_types"

    # --- Identificadores ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único do tipo de documento"
    )
    
    # --- Classificação ---
    category_id = Column(
        String, 
        ForeignKey("document_categories.id"), 
        nullable=False,
        doc="Vínculo com a categoria pai (Ex: Fiscal, Jurídico)"
    )
    
    # --- Identificação e Regras ---
    name = Column(
        String, 
        nullable=False,
        doc="Nome oficial (Ex: 'Certidão Negativa de Débitos Federais')"
    )
    
    slug = Column(
        String, 
        unique=True, 
        index=True, 
        nullable=False,
        doc="Identificador único para lógica de código (Ex: 'cnd_federal')"
    )
    
    validity_days_default = Column(
        Integer, 
        default=0,
        doc="Prazo padrão de validade em dias (0 = permanente/sem validade)"
    )
    
    description = Column(
        Text, 
        nullable=True,
        doc="Instruções ou descrição detalhada sobre a finalidade do documento"
    )

    scope = Column(
        SQLEnum(DocumentScope, native_enum=False, length=50), 
        server_default=DocumentScope.NATIONAL.value,  
        default=DocumentScope.NATIONAL, 
        nullable=False,
        doc="Escopo de abrangência do documento (Nacional/Estadual/Municipal)"
    )

    # --- Relacionamentos (ORM) ---
    category = relationship(
        "DocumentCategory", 
        back_populates="types"
    )
    
    # Certificados gerados a partir deste tipo
    certificates = relationship(
        "app.models.certificate_model.Certificate", 
        back_populates="document_type"
    )

    # Configuração técnica para o robô de emissão automática
    automation_config = relationship(
        "app.models.document_automation_model.DocumentAutomationConfig", 
        back_populates="document_type", 
        uselist=False, 
        cascade="all, delete-orphan"
    )