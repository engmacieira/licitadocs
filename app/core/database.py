"""
Configuração do Banco de Dados (SQLAlchemy).
Gerencia a conexão, o pool de sessões e a base declarativa para os modelos.
"""

import os
import sys
import uuid
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from dotenv import load_dotenv

# Inicialização de ambiente
load_dotenv()

# 1. Configurações de Conexão
DATABASE_URL = os.getenv("DATABASE_URL")

# Protocolo de Tolerância Zero: Interrompe a execução se o banco não estiver configurado
if not DATABASE_URL:
    print("🚨 [DATABASE] ERRO CRÍTICO: Variável DATABASE_URL não encontrada.")
    print("O LicitaDoc exige uma string de conexão PostgreSQL válida no arquivo .env.")
    sys.exit(1)

# 2. Engine & Session
# Configurado para PostgreSQL (sem check_same_thread necessário)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Fábrica de sessões com controle transacional manual (ACID)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base Declarativa
# Todos os models em app/models devem herdar desta classe
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