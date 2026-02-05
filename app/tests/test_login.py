from fastapi import status
from app.core.security import create_access_token

def test_login_success(client):
    """
    Cenário: Login com credenciais válidas.
    """
    # 1. Setup: Cria usuário pela rota LEGADA (mais simples para testes)
    user_payload = {
        "email": "login_user@teste.com",
        "password": "senha_forte_123"
        # Nota: register-simple não pede CNPJ nem arquivos
    }
    # ATENÇÃO: Mudamos para /register-simple
    client.post("/auth/register-simple", json=user_payload)

    # 2. Ação: Tentar logar
    login_data = {
        "username": "login_user@teste.com",
        "password": "senha_forte_123"
    }
    response = client.post("/auth/login", data=login_data)

    # 3. Asserção
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

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