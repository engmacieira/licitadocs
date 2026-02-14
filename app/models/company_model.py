"""
Modelagem de Empresas (Tenant).
Responsável pelos dados da Pessoa Jurídica e configurações da empresa.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # --- Dados Cadastrais (PJ) ---
    cnpj = Column(String, unique=True, index=True, nullable=False)
    razao_social = Column(String, nullable=False)
    nome_fantasia = Column(String, nullable=True)
    inscricao_estadual = Column(String, nullable=True)
    inscricao_municipal = Column(String, nullable=True)
    
    # --- Endereço Completo ---
    cep = Column(String, nullable=True)
    logradouro = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String, nullable=True) # UF
    
    # --- Contato e Responsável ---
    telefone = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    email_corporativo = Column(String, nullable=True)
    responsavel_nome = Column(String, nullable=True)
    responsavel_cpf = Column(String, nullable=True)

    # --- Auditoria (Owner original) ---
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relacionamentos (Usando String para evitar Circular Import)
    owner = relationship("app.models.user_model.User", back_populates="owned_companies", foreign_keys=[owner_id])
    
    # Vínculos N:N
    members = relationship("app.models.user_model.UserCompanyLink", back_populates="company", cascade="all, delete-orphan")
    
    # Documentos
    documents = relationship("app.models.document_model.Document", back_populates="company", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Controle Geral
    is_active = Column(Boolean, default=True)
    
    is_contract_signed = Column(Boolean, default=False)   # Contrato
    is_payment_active = Column(Boolean, default=False)    # Pagamento
    is_admin_verified = Column(Boolean, default=False)    # Aprovação Equipe
    
    @property
    def is_regular(self):
        """Retorna True apenas se cumprir todos os requisitos (Sua pontuação 15)"""
        return self.is_contract_signed and self.is_payment_active and self.is_admin_verified