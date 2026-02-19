"""
Modelagem de Certificados (Core).
Representa o documento estruturado e validado, vinculado a um Tipo específico.
"""
import enum
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class CertificateStatus(str, enum.Enum):
    VALID = "valid"       # ✅ Em dia
    WARNING = "warning"   # ⚠️ Vence em breve (ex: < 30 dias)
    EXPIRED = "expired"   # ❌ Vencido
    PROCESSING = "processing" # ⏳ Sendo lido pelo Robô
    ERROR = "error"       # 🚫 Falha na leitura/validação

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # =================================================================
    # Vínculos (Quem é o dono e O que é esse documento)
    # =================================================================
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    type_id = Column(String, ForeignKey("document_types.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True, unique=True)
    
    # =================================================================
    # Arquivo Físico
    # =================================================================
    file_path = Column(String, nullable=False) # Caminho no Storage (S3/Local)
    filename = Column(String, nullable=False)  # Nome original do arquivo (ex: 'CND_Federal_2024.pdf')
    
    # =================================================================
    # Dados Extraídos das Certidões
    # =================================================================
    authentication_code = Column(String, nullable=True, index=True)
    issue_date = Column(Date, nullable=True) # Data de Emissão
    expiration_date = Column(Date, nullable=True, index=True) # Data de Validade
    
    # =================================================================
    # Controle de Estado (Performance)
    # =================================================================
    status = Column(
        String, 
        default=CertificateStatus.VALID.value,
        index=True
    )
    
    # Metadados Flexíveis (JSON)
    metadata_info = Column(JSON, nullable=True) 

    # =================================================================
    # Auditoria
    # =================================================================
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    company = relationship("app.models.company_model.Company") 
    document_type = relationship("app.models.document_type_model.DocumentType", back_populates="certificates")
    document = relationship("app.models.document_model.Document", back_populates="certificate_info")