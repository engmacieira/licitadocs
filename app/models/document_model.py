"""
Modelagem de Documentos (SQLAlchemy).
Responsável por mapear a tabela 'documents' e suas regras de negócio.
"""
import uuid
import enum
from sqlalchemy import Column, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Função auxiliar para gerar UUIDs compatíveis com SQLite e Postgres
def generate_uuid():
    return str(uuid.uuid4())

class DocumentStatus(str, enum.Enum):
    """
    Define os estados possíveis de um documento no sistema.
    Usado para lógica de coloração no Frontend e alertas.
    """
    VALID = "valid"       # Em dia
    WARNING = "warning"   # Vence em breve (ex: < 30 dias)
    EXPIRED = "expired"   # Vencido

class Document(Base):
    """
    Representa um arquivo enviado (Upload) vinculado a uma empresa.
    
    Contém metadados (nome, validade) e o caminho físico do arquivo (file_path).
    Não armazena o binário do arquivo no banco (apenas o ponteiro).
    """
    __tablename__ = "documents"

    # =================================================================
    # Identificadores
    # =================================================================
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True,
        doc="Identificador único universal (UUID) do documento"
    )

    # =================================================================
    # Metadados do Arquivo
    # =================================================================
    filename = Column(
        String, 
        nullable=False,
        doc="Nome original do arquivo enviado pelo usuário (ex: 'certidao_fgts.pdf')"
    )
    file_path = Column(
        String, 
        nullable=False,
        doc="Caminho relativo ou absoluto onde o arquivo foi salvo no disco/bucket"
    )

    # =================================================================
    # Regras de Negócio (Vencimento & Status)
    # =================================================================
    expiration_date = Column(
        Date, 
        nullable=True,
        doc="Data de validade impressa no documento (Null = Documento sem vencimento)"
    )
    status = Column(
        String, 
        default=DocumentStatus.VALID.value,
        doc="Status atual calculado (Valid/Warning/Expired). Persistido para facilitar queries."
    )

    # =================================================================
    # Relacionamentos (Foreign Keys)
    # =================================================================
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Backref permite acessar 'company.documents' sem declarar lá explicitamente
    company = relationship("app.models.user_model.Company", backref="documents")

    # =================================================================
    # Auditoria (Quem e Quando)
    # =================================================================
    uploaded_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    uploader = relationship("app.models.user_model.User")
    
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        doc="Data e hora exata do upload"
    )