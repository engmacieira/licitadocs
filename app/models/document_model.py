import uuid
import enum
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Hack para funcionar UUID
def generate_uuid():
    return str(uuid.uuid4())

# Enum para Status (Regra de Negócio explícita no banco)
class DocumentStatus(str, enum.Enum):
    VALID = "valid"
    WARNING = "warning" # Vence em breve (ex: 30 dias)
    EXPIRED = "expired"

class Document(Base):
    """
    Tabela de Documentos.
    Armazena os metadados dos arquivos enviados pelas empresas.
    """
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Metadados do Arquivo
    filename = Column(String, nullable=False) # Nome original (ex: "certidao.pdf")
    file_path = Column(String, nullable=False) # Caminho no disco/S3 (ex: "/storage/uuid.pdf")
    
    # Regra de Negócio (Vencimento)
    expiration_date = Column(Date, nullable=True) # Nem todo doc vence, então pode ser null
    status = Column(String, default=DocumentStatus.VALID.value) # Simples string para compatibilidade SQLite
    
    # Relacionamento (Pertence a uma Empresa)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    company = relationship("app.models.user_model.Company", backref="documents")
    
    # Auditoria
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    uploader = relationship("app.models.user_model.User")
    created_at = Column(DateTime(timezone=True), server_default=func.now())