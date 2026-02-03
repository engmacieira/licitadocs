"""
Modelagem de Usuários e Empresas (SQLAlchemy).
Gerencia Autenticação (User) e Dados Corporativos (Company).
"""
import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    ADMIN = "admin"   # Acesso total (Upload, Gestão)
    CLIENT = "client" # Acesso apenas leitura (Dashboard)

class User(Base):
    """
    Entidade de Acesso (Login).
    Pode ser um Admin (Operação) ou um Cliente (Empresa).
    """
    __tablename__ = "users"

    # Identificadores
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Credenciais
    email = Column(String, unique=True, index=True, nullable=False, doc="E-mail de login")
    password_hash = Column(String, nullable=False, doc="Hash Bcrypt da senha (nunca plaintext)")
    
    # Controle de Acesso
    is_active = Column(Boolean, default=True, doc="Se False, bloqueia o login imediatamente")
    role = Column(String, default=UserRole.CLIENT.value, nullable=False, doc="Define permissões (admin/client)")
    
    # Multi-Tenancy (Vínculo com Empresa)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    
    # Relacionamentos
    # user_company: A empresa onde este usuário trabalha/pertence
    user_company = relationship(
        "Company", 
        back_populates="employees", 
        foreign_keys=[company_id]
    )
    
    # owned_company: A empresa que este usuário CRIOU (se for um Admin criando clientes)
    owned_company = relationship(
        "Company", 
        back_populates="owner", 
        uselist=False, 
        foreign_keys="[Company.owner_id]"
    )

    # Auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Company(Base):
    """
    Entidade Corporativa.
    Agrupa documentos e usuários. É o 'Tenant' do sistema.
    """
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Dados Cadastrais
    cnpj = Column(String, unique=True, index=True, nullable=False)
    
    # NOTA DE REFATORAÇÃO: O banco usa 'razao_social', mas a API/Schema expõe como 'name'.
    # O mapeamento é feito via Pydantic (validation_alias). Não alterar aqui sem migration!
    razao_social = Column(String, nullable=False, doc="Nome oficial da empresa")
    nome_fantasia = Column(String, nullable=True, doc="Nome comercial (opcional)")
    
    # Auditoria de Criação (Quem cadastrou essa empresa?)
    owner_id = Column(String, ForeignKey("users.id", use_alter=True, name="fk_company_owner"))
    
    # Relacionamentos
    owner = relationship(
        "User", 
        back_populates="owned_company", 
        foreign_keys=[owner_id]
    )
    
    # Lista de funcionários vinculados a esta empresa
    employees = relationship(
        "User", 
        back_populates="user_company", 
        foreign_keys=[User.company_id]
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())