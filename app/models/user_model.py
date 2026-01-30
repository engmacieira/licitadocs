import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID # Preparando para Postgres futuro
from app.core.database import Base

# Hack para funcionar UUID no SQLite e no Postgres sem dor de cabeça
def generate_uuid():
    return str(uuid.uuid4())

# 1. Definição dos Cargos Disponíveis
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CLIENT = "client"

class User(Base):
    """
    Tabela de Usuários.
    Gerencia o acesso ao sistema (Login).
    """
    __tablename__ = "users"

    # Identificação única universal
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Dados de Acesso
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False) # NUNCA salvar senha pura
    
    # Controle
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(String, default=UserRole.CLIENT.value, nullable=False)
    
    # --- COLUNA PARA MULTI-TENANCY ---
    # Vincula o usuário a uma empresa específica
    company_id = Column(String, ForeignKey("companies.id"), nullable=True) 
    
    # Relacionamentos
    user_company = relationship("Company", back_populates="employees", foreign_keys=[company_id])
    
    # Para saber quem criou a empresa originalmente
    owned_company = relationship("Company", back_populates="owner", uselist=False, foreign_keys="[Company.owner_id]")

class Company(Base):
    """
    Tabela de Empresas.
    Os documentos serão vinculados a esta entidade.
    """
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Dados cadastrais
    cnpj = Column(String, unique=True, index=True, nullable=False)
    razao_social = Column(String, nullable=False)
    nome_fantasia = Column(String, nullable=True)
    
    # Chave Estrangeira (Quem é o dono desta empresa?)
    owner_id = Column(String, ForeignKey("users.id"))
    
    # Relacionamento reverso
    owner = relationship("User", back_populates="owned_company", foreign_keys=[owner_id])
    employees = relationship("User", back_populates="user_company", foreign_keys=[User.company_id])
    
    # Auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())