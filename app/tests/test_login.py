from fastapi import status
from app.core.security import create_access_token

def test_login_success(client):
    """
    Cenário: Login com credenciais válidas.
    Resultado: 200 OK e Token JWT retornado.
    """
    # 1. Setup: Precisamos criar um usuário antes de tentar logar
    user_payload = {
        "email": "login_user@teste.com",
        "password": "senha_forte_123",
        "is_active": True
    }
    client.post("/auth/register", json=user_payload)

    # 2. Ação: Tentar logar
    # ATENÇÃO: OAuth2 usa Form-Data, então usamos o parametro 'data' e não 'json'
    # E o campo de email deve ser enviado como 'username'
    login_data = {
        "username": "login_user@teste.com",
        "password": "senha_forte_123"
    }
    response = client.post("/auth/login", data=login_data)

    # 3. Asserção
    assert response.status_code == status.HTTP_200_OK
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_login_wrong_password(client):
    """
    Cenário: Email correto, senha errada.
    Resultado: 401 Unauthorized.
    """
    # 1. Setup
    user_payload = {
        "email": "wrong_pass@teste.com",
        "password": "senha_certa",
        "is_active": True
    }
    client.post("/auth/register", json=user_payload)

    # 2. Ação: Senha errada
    login_data = {
        "username": "wrong_pass@teste.com",
        "password": "senha_ERRADA"
    }
    response = client.post("/auth/login", data=login_data)

    # 3. Asserção
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Email ou senha incorretos"

def test_login_user_not_found(client):
    """
    Cenário: Email não cadastrado.
    Resultado: 401 Unauthorized (Por segurança, não dizemos que o email não existe).
    """
    login_data = {
        "username": "fantasma@teste.com",
        "password": "123"
    }
    response = client.post("/auth/login", data=login_data)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED