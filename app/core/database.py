"""
Configuração do Banco de Dados (SQLAlchemy).
Gerencia a conexão, o pool de sessões e a base declarativa para os modelos.
"""

import sys
import uuid
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from app.core.config import settings

# Protocolo de Tolerância Zero (A validação agora é feita pelo Pydantic no config.py)
# Mas mantemos a trava de segurança por garantia.
if not settings.DATABASE_URL:
    print("🚨 [DATABASE] ERRO CRÍTICO: Variável DATABASE_URL não encontrada.")
    sys.exit(1)

# 2. Engine & Session
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    pool_size=50,
    max_overflow=150,
    pool_timeout=30
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Funções Utilitárias ---

class SoftDeleteMixin:
    """
    Mixin para implementação de Soft Delete.
    Adiciona a coluna 'deleted_at' a qualquer modelo que herdar desta classe.
    """
    deleted_at = Column(
        DateTime(timezone=True), 
        nullable=True, 
        doc="Data e hora da exclusão lógica (Null = Registro Ativo)"
    )

def generate_uuid() -> str:
    """
    Gera um UUID v4 como string para chaves primárias.
    """
    return str(uuid.uuid4())

def get_db():
    """
    Dependency Injection para rotas FastAPI.
    Garante que cada requisição tenha sua própria sessão e que ela seja fechada.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()