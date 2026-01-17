import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Buscando a URL do banco do arquivo .env ou usando um padrão SQLite para dev
# Em produção (Postgres), essa variável virá do ambiente do servidor.
SQLALCHEMY_DATABASE_URL = os.getenv("DB_URL", "sqlite:///./licita_doc.db")

# Configuração específica para SQLite (threads) vs Postgres
connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

# 1. Engine: O motor que processa as queries
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    echo=False # Mude para True se quiser ver o SQL bruto no terminal (bom para debug)
)

# 2. SessionLocal: A fábrica de sessões. Cada requisição terá sua própria sessão.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base: A classe pai de todos os nossos Models
Base = declarative_base()

# Função utilitária para pegar a conexão (Dependency Injection do FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()