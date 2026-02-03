"""
Modelo de Certidões (Extension Table).
Especialização da tabela 'documents' para armazenar metadados de validade e fiscalização.
"""
from sqlalchemy import Column, String, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base, generate_uuid

class CertificateType(str, enum.Enum):
    FEDERAL = "federal"
    ESTADUAL = "estadual"
    MUNICIPAL = "municipal"
    TRABALHISTA = "trabalhista"
    FALENCIA = "falencia"
    OUTROS = "outros"

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Vínculo com o Documento pai (Um documento genérico PODE SER uma certidão)
    document_id = Column(String, ForeignKey("documents.id"), unique=True, nullable=False)
    
    # Dados Específicos da Certidão
    certificate_type = Column(String, nullable=False, doc="Tipo fiscal/jurídico da certidão")
    control_code = Column(String, nullable=True, doc="Código de autenticidade para validação web")
    issuing_body = Column(String, nullable=True, doc="Órgão emissor (ex: Receita Federal)")
    
    # Datas Críticas
    emission_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=False, index=True, doc="Usado para calcular vencimento")

    # Relacionamento Reverso
    document = relationship("Document", back_populates="certificate_info")