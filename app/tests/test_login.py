"""
Testes de Autenticação (Login).
Foca na obtenção do Token JWT.
"""
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user_model import User, UserRole
from app.main import app

# Instancia o client caso não venha da fixture (garantia)
client = TestClient(app)

def setup_user(db: Session, email: str, password: str):
    """Helper para criar usuário direto no banco (Mais seguro que depender da rota de registro)"""
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_login_success(client, db_session: Session):
    """
    Cenário: Login com credenciais válidas na rota padrão (/auth/token).
    """
    email = "login_ok@teste.com"
    password = "senha_forte_123"
    
    # 1. Setup (Cria no banco)
    setup_user(db_session, email, password)

    # 2. Ação: Login (OAuth2 Standard Form Data)
    login_data = {
        "username": email,
        "password": password
    }
    
    # Tenta na rota padrão do FastAPI/OAuth2
    response = client.post("/auth/token", data=login_data)

    # 3. Asserção
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, db_session: Session):
    """
    Cenário: Email correto, senha errada.
    """
    email = "wrong_pass@teste.com"
    password = "senha_certa"
    
    setup_user(db_session, email, password)

    # 2. Ação: Senha errada
    login_data = {
        "username": email,
        "password": "senha_ERRADA"
    }
    response = client.post("/auth/token", data=login_data)

    # 3. Asserção
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorretos" in response.json().get("detail", "").lower()

def test_login_user_not_found(client, db_session: Session):
    """
    Cenário: Email não cadastrado.
    """
    login_data = {
        "username": "fantasma@teste.com",
        "password": "123"
    }
    response = client.post("/auth/token", data=login_data)
    
    # Por segurança, o sistema retorna 401 (Igual a senha errada)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED