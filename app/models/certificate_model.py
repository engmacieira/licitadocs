"""
Modelagem de Certificados (Core do LicitaDoc).
Representa o documento técnico estruturado, validado e vinculado a uma Empresa.
Contém os metadados extraídos (datas, códigos) para controle de regularidade.
"""

import enum
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin,generate_uuid

class CertificateStatus(str, enum.Enum):
    """Estados vitais para o Dashboard de Conformidade (US-02)."""
    VALID = "valid"           # ✅ Certidão válida e dentro do prazo
    WARNING = "warning"       # ⚠️ Próxima do vencimento (Alerta para Renovação)
    EXPIRED = "expired"       # ❌ Vencida (Irregularidade detectada)
    PROCESSING = "processing" # ⏳ Robô em operação de leitura/extração
    ERROR = "error"           # 🚫 Falha técnica na validação do documento
    ARCHIVED = "archived"     # 📦 Arquivado (Versão obsoleta ou substituída)

class Certificate(Base, SoftDeleteMixin):
    """
    Entidade central que armazena a 'inteligência' do documento.
    Diferente do 'Document' (arquivo bruto), o 'Certificate' possui 
    as datas e códigos validados para o sistema de monitoramento.
    """
    __tablename__ = "certificates"

    # --- Identificadores ---
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # --- Vínculos (Foreign Keys) ---
    company_id = Column(
        String, 
        ForeignKey("companies.id"), 
        nullable=False, 
        index=True,
        doc="ID da empresa proprietária desta certidão"
    )
    type_id = Column(
        String, 
        ForeignKey("document_types.id"), 
        nullable=False, 
        index=True,
        doc="ID do catálogo (Ex: CND Federal, FGTS)"
    )
    document_id = Column(
        String, 
        ForeignKey("documents.id"), 
        nullable=True, 
        unique=True,
        doc="Vínculo 1:1 com o arquivo físico na tabela documents"
    )
    
    # --- Gestão de Arquivos ---
    file_path = Column(String, nullable=False, doc="Caminho relativo no storage")
    filename = Column(String, nullable=False, doc="Nome original do arquivo (Ex: CND_2024.pdf)")
    
    # --- Dados Extraídos (Inteligência Jurídica) ---
    authentication_code = Column(String, nullable=True, index=True, doc="Código de autenticidade da certidão")
    issue_date = Column(Date, nullable=True, doc="Data em que o órgão emitiu o documento")
    expiration_date = Column(Date, nullable=True, index=True, doc="Data limite de validade")
    
    # --- Estado e Metadados ---
    status = Column(
        String, 
        default=CertificateStatus.VALID.value,
        index=True,
        doc="Status atual para o semáforo de regularidade"
    )
    
    # Armazena dados extras dinâmicos (Ex: Motivo de erro ou campos específicos do órgão)
    metadata_info = Column(JSON, nullable=True) 

    # --- Auditoria ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # --- Relacionamentos (ORM) ---
    # Nota: Usamos strings para os caminhos dos modelos para evitar Imports Circulares.
    company = relationship("app.models.company_model.Company") 
    document_type = relationship(
        "app.models.document_type_model.DocumentType", 
        back_populates="certificates"
    )
    document = relationship(
        "app.models.document_model.Document", 
        back_populates="certificate_info"
    )