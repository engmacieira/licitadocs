"""
Modelagem de Usuários (Auth & Profile).
Define o acesso ao sistema (User) e o vínculo com empresas (UserCompanyLink).
"""
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, generate_uuid

# --- ENUMS ---
class UserRole(str, enum.Enum):
    ADMIN = "admin"   # Super Usuário da Plataforma (Staff/Suporte)
    CLIENT = "client" # Usuário de Empresas (SaaS)

class UserCompanyRole(str, enum.Enum):
    MASTER = "MASTER"   # Admin da Empresa (Pode tudo na empresa)
    VIEWER = "VIEWER"   # Membro (Só visualiza)

# --- TABELA ASSOCIATIVA (Members) ---
class UserCompanyLink(Base):
    __tablename__ = "user_company_links"
    
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), primary_key=True)
    
    role = Column(String, default=UserCompanyRole.VIEWER.value, nullable=False)
    is_active = Column(Boolean, default=True) 
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="company_links")
    company = relationship("app.models.company_model.Company", back_populates="members")
    
# --- USUÁRIO (Profile) ---
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    # Credenciais
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Papel Global (Sistema)
    role = Column(String, default=UserRole.CLIENT.value, nullable=False)
    
    # Dados Pessoais (Novos Sprint 15)
    cpf = Column(String, unique=True, index=True, nullable=True)
    rg = Column(String, nullable=True)
    celular = Column(String, nullable=True)
    genero = Column(String, nullable=True)
    
    # Relacionamentos
    company_links = relationship("UserCompanyLink", back_populates="user", cascade="all, delete-orphan")
    
    # Relação para saber quais empresas este usuário "fundou" (para fins de auditoria/cobrança)
    owned_companies = relationship(
        "app.models.company_model.Company", 
        back_populates="owner"
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())