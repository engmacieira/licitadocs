"""
Configuração do Banco de Dados (SQLAlchemy).
Gerencia a conexão e a sessão (SessionLocal) usada em cada requisição.
"""
import os
import sys
import uuid
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
# 1. Definição da URL de Conexão (Exclusivo via Variável de Ambiente)
DATABASE_URL_ENV = os.getenv("DATABASE_URL")

# Trava de Segurança: Sem PostgreSQL, sem inicialização. (Fail Fast)
if not DATABASE_URL_ENV:
    print("🚨 ERRO CRÍTICO [DATABASE]: Variável DATABASE_URL não encontrada no ambiente.")
    print("O LicitaDoc não utiliza mais SQLite local. É obrigatório fornecer a string de conexão do PostgreSQL.")
    print("Verifique o seu arquivo .env ou as variáveis injetadas no docker-compose.")
    sys.exit(1)

# 2. Engine (O Motor)
# Como agora somos 100% PostgreSQL, não precisamos mais do argumento 'check_same_thread=False'
engine = create_engine(DATABASE_URL_ENV)

# 3. SessionFactory (Fábrica de Sessões)
# autocommit=False: Controle transacional manual para garantir o ACID
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base Model
# Todas as classes (User, Company, Document) herdarão daqui
Base = declarative_base()

# 5. Funções Utilitárias de Banco

def generate_uuid():
    """
    Gera UUID compatível com chave primária (String).
    """
    return str(uuid.uuid4())

# Dependency Injection (Usado nas Rotas: db: Session = Depends(get_db))
def get_db():
    """
    Gera uma nova sessão de banco para cada requisição HTTP e a fecha no final.
    Garante que não deixaremos conexões penduradas (Memory Leak) ou esgotaremos o Pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()