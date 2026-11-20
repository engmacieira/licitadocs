"""
Modelagem de Leads capturados via PNCP (Portal Nacional de Contratações Públicas).
Inclui campos de identificação da empresa prospectada e controle anti-SPAM de contatos.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid


class PncpLead(Base, SoftDeleteMixin):
    """
    Representa um potencial cliente (fornecedor/licitante) capturado do PNCP
    para prospecção ativa com controle de janela anti-SPAM.
    """
    __tablename__ = "pncp_leads"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    cnpj = Column(String(14), unique=True, index=True, nullable=False, doc="CNPJ normalizado (14 dígitos)")
    razao_social = Column(String, nullable=False)
    nome_fantasia = Column(String, nullable=True)
    email = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    uf = Column(String(2), index=True, nullable=True)
    municipio = Column(String, nullable=True)
    porte = Column(String, nullable=True)
    origem_pncp = Column(String, nullable=True, doc="Referência da licitação/contratação/órgão no PNCP")

    # Controle anti-SPAM
    last_contacted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    contact_count = Column(Integer, nullable=False, default=0, server_default="0")
    last_contact_channel = Column(String(50), nullable=True)
    last_contact_notes = Column(Text, nullable=True)
    spam_cooldown_days = Column(Integer, nullable=False, default=7, server_default="7")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
