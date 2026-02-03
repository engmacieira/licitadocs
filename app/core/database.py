"""
Configuração do Banco de Dados (SQLAlchemy).
Gerencia a conexão e a sessão (SessionLocal) usada em cada requisição.
"""
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Definição da URL de Conexão
# Prioridade: Variável de Ambiente (Prod) > SQLite Local (Dev)
SQLALCHEMY_DATABASE_URL = os.getenv("DB_URL", "sqlite:///./licita_doc.db")

# 2. Configurações Específicas
connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # SQLite precisa dessa flag para permitir acesso de múltiplas threads (FastAPI é async)
    connect_args = {"check_same_thread": False}

# 3. Engine (O Motor)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    # echo=True  # Descomente para ver SQL bruto no terminal (Debug)
)

# 4. SessionFactory (Fábrica de Sessões)
# autocommit=False: Controle transacional manual (nós damos o commit)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Base Model
# Todas as classes (User, Company, Document) herdarão daqui
Base = declarative_base()

# 6. Gerador de UUID
# Gera UUID compatível com chave primária (String)
def generate_uuid():
    return str(uuid.uuid4())

# Dependency Injection (Usado nas Rotas: db: Session = Depends(get_db))
def get_db():
    """
    Gera uma nova sessão de banco para cada requisição HTTP e a fecha no final.
    Garante que não deixaremos conexões penduradas (Memory Leak).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()