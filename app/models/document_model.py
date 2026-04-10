"""
Modelagem de Documentos (Geral).
Responsável por mapear os arquivos físicos armazenados e seus metadados básicos.
Diferencia uploads manuais de clientes de emissões automáticas do sistema.
"""

import enum
from sqlalchemy import Column, String, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

class DocumentStatus(str, enum.Enum):
    """
    Define os estados possíveis de um documento para controle visual.
    Utilizado para o 'Semáforo' no Dashboard de Conformidade (US-02).
    """
    VALID = "valid"       # ✅ Documento dentro do prazo
    WARNING = "warning"   # ⚠️ Próximo ao vencimento
    EXPIRED = "expired"   # ❌ Prazo de validade ultrapassado
    PENDING = "pending"   # ⏳ Aguardando conferência (Upload do Cliente)

class Document(Base, SoftDeleteMixin):
    """
    Entidade que representa o arquivo físico e seu estado no sistema.
    Não armazena o binário, apenas o ponteiro (path) e metadados de validade.
    """
    __tablename__ = "documents"

    # --- Identificadores e Título ---
    id = Column(
        String, 
        primary_key=True, 
        default=generate_uuid, 
        index=True, 
        doc="Identificador único universal (UUID)"
    )
    title = Column(
        String, 
        nullable=True, 
        doc="Título amigável para exibição (Ex: 'Contrato Social 2024')"
    )

    # --- Metadados do Arquivo Físico ---
    filename = Column(
        String, 
        nullable=False,
        doc="Nome original do arquivo (Ex: 'certidao_fgts.pdf')"
    )
    file_path = Column(
        String, 
        nullable=False,
        doc="Caminho relativo no storage/disco para recuperação do arquivo"
    )
    is_client_upload = Column(
        Boolean, 
        default=False,
        doc="Indica se o arquivo veio de um upload manual do cliente ou via sistema/admin"
    )

    # --- Regras de Negócio e Validade ---
    expiration_date = Column(
        Date, 
        nullable=True,
        doc="Data de validade (Null indica documento permanente/sem vencimento)"
    )
    status = Column(
        String, 
        default=DocumentStatus.VALID.value,
        doc="Status atual calculado (Valid/Warning/Expired)"
    )

    # --- Relacionamentos e Vínculos (Foreign Keys) ---
    company_id = Column(
        String, 
        ForeignKey("companies.id"), 
        nullable=False,
        doc="Vínculo com a empresa proprietária do documento"
    )
    
    uploaded_by_id = Column(
        String, 
        ForeignKey("users.id"), 
        nullable=True,
        doc="ID do usuário (Admin ou Cliente) que realizou a ação"
    )

    # --- Auditoria ---
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        doc="Data e hora exata do registro no sistema"
    )

    # --- Relacionamentos (ORM) ---
    company = relationship(
        "app.models.company_model.Company", 
        back_populates="documents"
    )
    
    uploader = relationship("app.models.user_model.User")
    
    # Vínculo 1:1 com Certidão (Se este documento possuir dados técnicos extraídos)
    certificate_info = relationship(
        "app.models.certificate_model.Certificate", 
        back_populates="document", 
        uselist=False,
        cascade="all, delete-orphan"
    )