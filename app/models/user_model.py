"""
Modelagem de Usuários (Auth & Profile).
Define as credenciais de acesso, perfis de usuário e a tabela associativa 
que vincula colaboradores às empresas (Multi-tenant).
"""

import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, SoftDeleteMixin, generate_uuid

# --- ENUMS de Acesso ---

class UserRole(str, enum.Enum):
    """Papel global do usuário no ecossistema da plataforma."""
    ADMIN = "admin"   # Staff da LicitaDoc (Suporte/Operação)
    CLIENT = "client" # Usuário final (Licitante)

class UserCompanyRole(str, enum.Enum):
    """Nível de permissão específico dentro de uma Empresa."""
    MASTER = "MASTER"   # Gestor da conta (Pode gerenciar documentos e membros)
    VIEWER = "VIEWER"   # Visualizador (Apenas consulta o Kit de Licitação)

# --- TABELA ASSOCIATIVA (Vínculos Usuário x Empresa) ---

class UserCompanyLink(Base, SoftDeleteMixin):
    """
    Tabela de ligação N:N entre Usuários e Empresas.
    Permite que um mesmo consultor gerencie múltiplas empresas licitantes.
    """
    __tablename__ = "user_company_links"
    
    user_id = Column(
        String, 
        ForeignKey("users.id"), 
        primary_key=True,
        doc="ID do usuário membro"
    )
    company_id = Column(
        String, 
        ForeignKey("companies.id"), 
        primary_key=True,
        doc="ID da empresa vinculada"
    )
    
    role = Column(
        String, 
        default=UserCompanyRole.VIEWER.value, 
        nullable=False,
        doc="Papel do usuário especificamente nesta empresa"
    )
    
    is_active = Column(
        Boolean, 
        default=True,
        doc="Status do vínculo (Permite desativar acesso sem excluir o histórico)"
    )
    
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="company_links")
    company = relationship("app.models.company_model.Company", back_populates="members")
    
# --- ENTIDADE USUÁRIO (Profile & Auth) ---

class User(Base, SoftDeleteMixin):
    """
    Entidade principal de autenticação e dados pessoais.
    Contém o hash da senha e informações necessárias para o Onboarding (US-01).
    """
    __tablename__ = "users"

    # --- Identificador e Credenciais ---
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    
    email = Column(
        String, 
        unique=True, 
        index=True, 
        nullable=False,
        doc="E-mail de login (único no sistema)"
    )
    
    password_hash = Column(
        String, 
        nullable=False,
        doc="Senha criptografada via Bcrypt (security.py)"
    )
    
    role = Column(
        String, 
        default=UserRole.CLIENT.value, 
        nullable=False,
        doc="Papel global do usuário"
    )
    
    is_active = Column(
        Boolean, 
        default=True,
        doc="Indica se o usuário pode realizar login"
    )

    is_email_verified = Column(
        Boolean, 
        default=False,
        doc="Indica se o utilizador confirmou a posse do e-mail"
    )

    # --- Dados de Perfil e Qualificação (Sprint 15) ---
    nome = Column(String, nullable=True)
    cpf = Column(String, unique=True, index=True, nullable=True)
    rg = Column(String, nullable=True)
    celular = Column(String, nullable=True)
    genero = Column(String, nullable=True)
    nacionalidade = Column(String, nullable=True)
    estado_civil = Column(String, nullable=True)
    profissao = Column(String, nullable=True)
    
    # --- Auditoria ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos (ORM) ---
    
    # Lista de empresas das quais o usuário é membro
    company_links = relationship(
        "UserCompanyLink", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    
    # Empresas fundadas por este usuário (Auditoria de Onboarding)
    owned_companies = relationship(
        "app.models.company_model.Company", 
        back_populates="owner"
    )