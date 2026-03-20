"""
Modelagem do Motor de Regras de Emissão (Diretórios).
Responsável por armazenar o 'mapa' de busca de documentos, cruzando 
o Tipo de Documento com a localização geográfica (Estado/Cidade).
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class EmissionRule(Base, SoftDeleteMixin):
    """
    Define o procedimento de obtenção para um documento específico.
    Funciona como um manual de instruções para o Módulo 3 (Fábrica de Certidões),
    seja para automação via robô ou para solicitação manual.
    """
    __tablename__ = "emission_rules"

    # --- Identificador ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único da regra de emissão"
    )
    
    # --- Contexto e Filtros (Onde e O Quê) ---
    document_type_id = Column(
        String, 
        ForeignKey("document_types.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True,
        doc="Vínculo com o tipo de documento no catálogo"
    )
    
    state = Column(
        String(2), 
        nullable=True, 
        index=True, 
        doc="Sigla do Estado (UF). Nulo se for uma regra Nacional."
    )
    
    city = Column(
        String, 
        nullable=True, 
        index=True, 
        doc="Nome da cidade. Nulo se for regra Nacional ou Estadual."
    )
    
    # --- Ações de Emissão (Como) ---
    emission_link = Column(
        String, 
        nullable=True,
        doc="Hiperlink oficial para o portal de emissão do órgão"
    )
    
    # --- Contatos para Solicitação Manual ---
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_whatsapp = Column(String, nullable=True)
    
    # --- Notas de Operação ---
    operation_notes = Column(
        String, 
        nullable=True,
        doc="Instruções manuais para a equipe (Ex: 'Requer senha do e-CAC')"
    )

    # --- Auditoria ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Relacionamentos (ORM) ---
    document_type = relationship(
        "app.models.document_type_model.DocumentType"
    )