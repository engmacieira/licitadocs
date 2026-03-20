"""
Modelagem de Solicitações de Emissão (Fila de Trabalho).
Registra as demandas de busca de certidões, vinculando a regra técnica 
à empresa solicitante e ao status de execução.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class EmissionRequest(Base, SoftDeleteMixin):
    """
    Representa um item na fila de emissão de documentos.
    Utilizado pelo Módulo 3 (Fábrica de Certidões) para gerenciar o 
    fluxo de trabalho de robôs e humanos.
    """
    __tablename__ = "emission_requests"
    
    # --- Identificador ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="ID único da solicitação de emissão"
    )

    # --- Vínculos Técnicos e de Negócio ---
    emission_rule_id = Column(
        String, 
        ForeignKey("emission_rules.id", ondelete="CASCADE"), 
        nullable=False,
        doc="Referência à regra/estratégia de emissão que deve ser usada"
    )
    
    company_id = Column(
        String, 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False,
        doc="ID da empresa que receberá o documento"
    )
    
    requested_by_id = Column(
        String, 
        ForeignKey("users.id"), 
        nullable=False,
        doc="Usuário ou Sistema que disparou a solicitação"
    )
    
    # --- Controle de Estado e Prazos ---
    status = Column(
        String, 
        default="pending",
        doc="Estado atual da solicitação (Ex: 'pending', 'processing', 'completed', 'error')"
    ) 
    
    estimated_date = Column(
        Date, 
        nullable=True,
        doc="Previsão de entrega para o cliente (útil para solicitações manuais demoradas)"
    ) 
    
    # --- Auditoria ---
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        doc="Data de criação do ticket de emissão"
    )
    
    updated_at = Column(
        DateTime(timezone=True), 
        onupdate=func.now(),
        doc="Data da última alteração de status"
    )