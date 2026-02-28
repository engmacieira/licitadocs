"""
Configuração Base de Testes (Fixtures).
Cria o ambiente isolado de banco em memória e fornece 
clientes da API já autenticados para testes de segurança e ACL.
"""
import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user_model import User, UserRole

# 1. Configura Banco em Memória (SQLite Memory)
SQLALCHEMY_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5435/licitadocs_test"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Fixture do Banco de Dados
@pytest.fixture(scope="function")
def db_session():
    """
    Cria tabelas limpas para CADA teste e destrói após a execução.
    Garante isolamento total (Test Isolation).
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        
# 3. Fixture do Cliente API (Público/Sem Autenticação)
@pytest.fixture(scope="function")
def client(db_session):
    """
    Cliente da API base com a injeção do banco em memória.
    Útil para testar rotas públicas (como Login e Register).
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass    

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

# 4. Fixtures Geradoras de Token (Fábrica de Usuários)
@pytest.fixture(scope="function")
def normal_user_token(db_session):
    """Cria um usuário CLIENT comum e retorna seu JWT."""
    user = User(
        email="cliente_qa@teste.com",
        password_hash=get_password_hash("senha_segura_123"),
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return create_access_token(data={"sub": user.email})

@pytest.fixture(scope="function")
def admin_user_token(db_session):
    """Cria um usuário ADMIN e retorna seu JWT."""
    admin = User(
        email="admin_qa@teste.com",
        password_hash=get_password_hash("admin_seguro_123"),
        role=UserRole.ADMIN.value,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    return create_access_token(data={"sub": admin.email})

# 5. Fixtures de Clientes Prontos (O Pulo do Gato 🐱‍👤)
@pytest.fixture(scope="function")
def authorized_client(client, normal_user_token):
    """
    Retorna o TestClient já com o header de Authorization injetado.
    Pronto para bater em rotas que exigem login de usuário comum.
    """
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {normal_user_token}"
    }
    return client

@pytest.fixture(scope="function")
def admin_client(client, admin_user_token):
    """
    Retorna o TestClient com privilégios de Administrador.
    Pronto para bater em rotas restritas de sistema.
    """
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {admin_user_token}"
    }
    return client