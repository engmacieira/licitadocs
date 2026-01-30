"""
Configuração de Testes (Fixtures).
Cria um banco de dados temporário em memória para rodar os testes isolados.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db

# 1. Configura Banco em Memória (SQLite Memory)
# StaticPool é vital para usar SQLite em memória com múltiplos threads
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Fixture do Banco de Dados
@pytest.fixture(scope="function")
def db_session():
    """
    Cria as tabelas antes do teste e as destrói depois.
    """
    # Cria tabelas
    Base.metadata.create_all(bind=engine)
    
    # Cria sessão
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        # Fecha sessão e limpa tabelas
        db.close()
        Base.metadata.drop_all(bind=engine)

# 3. Fixture do Cliente API (Simula o Postman)
@pytest.fixture(scope="function")
def client(db_session):
    """
    Substitui a dependência de banco da API pelo nosso banco de teste.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass    

    # Injeção de Dependência (Overrides)
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c