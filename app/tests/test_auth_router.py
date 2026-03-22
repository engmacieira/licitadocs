import pytest
import os
from fastapi import status
from app.core.security import get_password_hash
from app.models.user_model import User
from app.tests.conftest import generate_valid_cnpj

def test_register_success(client):
    """Valida o Happy Path do registro completo (Onboarding)."""
    payload = {
        "email": "newuser@example.com",
        "password": "strongpassword",
        "legal_name": "New Company LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "John Doe",
        "cpf": "12345678901"
    }
    response = client.post("/auth/register", data=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"

def test_register_duplicate_email(client, test_user):
    """Teste de constraint: impede e-mail duplicado."""
    payload = {
        "email": test_user.email,
        "password": "password123",
        "legal_name": "Another Company",
        "cnpj": "98765432000188",
        "responsible_name": "Jane Doe",
        "cpf": "98765432100"
    }
    response = client.post("/auth/register", data=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "E-mail já cadastrado no sistema."

def test_login_success(client, db_session):
    """Valida o Happy Path do login."""
    email = "login_test@example.com"
    password = "password123"
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
        nome="Login Test",
        cpf="00011122233"
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/token",
        data={"username": email, "password": password}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    """Valida erro em credenciais inválidas."""
    response = client.post(
        "/auth/token",
        data={"username": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_register_missing_fields(client):
    """Teste de constraint: campos obrigatórios no register."""
    payload = {
        "email": "missing@example.com",
        # password is missing
        "legal_name": "Missing Co",
        "cnpj": "00000000000000",
        "responsible_name": "No One",
        "cpf": "00000000000"
    }
    response = client.post("/auth/register", data=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

def test_register_error_cases(client, db_session, test_user):
    """Testa erros no processo de registro."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    
    valid_cnpj = generate_valid_cnpj()
    valid_cpf = generate_valid_cpf()
    
    # E-mail já cadastrado
    payload = {
        "email": test_user.email,
        "password": "password123",
        "legal_name": "Empresa Erro",
        "cnpj": valid_cnpj,
        "responsible_name": "Dono",
        "cpf": valid_cpf
    }
    response = client.post("/auth/register", data=payload)
    assert response.status_code == 400
    assert "E-mail já cadastrado" in response.json()["detail"]
    
    # CNPJ já cadastrado
    cnpj_repetido = generate_valid_cnpj()
    # Primeiro registra um
    payload["email"] = f"other_{os.urandom(2).hex()}@example.com"
    payload["cnpj"] = cnpj_repetido
    payload["cpf"] = generate_valid_cpf()
    client.post("/auth/register", data=payload)
    
    # Tenta de novo com mesmo CNPJ
    payload["email"] = f"another_{os.urandom(2).hex()}@example.com"
    payload["cpf"] = generate_valid_cpf()
    response = client.post("/auth/register", data=payload)
    assert response.status_code == 400
    assert "CNPJ já cadastrado" in response.json()["detail"]

def test_login_inactive_user(client, db_session):
    """Testa login de usuário inativo."""
    from app.core.security import get_password_hash
    from app.models.user_model import User
    import os
    
    user_email = f"inactive_{os.urandom(4).hex()}@example.com"
    user = User(
        email=user_email,
        password_hash=get_password_hash("password123"),
        is_active=False,
        role="client"
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post("/auth/token", data={"username": user_email, "password": "password123"})
    assert response.status_code == 403
    assert "Acesso bloqueado" in response.json()["detail"]

def test_register_simple_error(client, db_session, test_user):
    """Testa erro no registro simplificado."""
    response = client.post("/auth/register-simple", json={
        "email": test_user.email,
        "password": "any"
    })
    assert response.status_code == 400

def test_simulate_payment(client, db_session, test_user, monkeypatch):
    """Testa a rota de simulação de pagamento."""
    # Garante ambiente de desenvolvimento
    monkeypatch.setenv("ENV", "development")
    
    # Usuário inexistente
    response = client.post("/auth/simulate-payment", json={"email": "non_existent@example.com"})
    assert response.status_code == 404
    
    # Usuário real
    test_user.is_active = False
    db_session.commit()
    
    response = client.post("/auth/simulate-payment", json={"email": test_user.email})
    assert response.status_code == 200
    
    db_session.refresh(test_user)
    assert test_user.is_active is True
    
    # Em produção
    monkeypatch.setenv("ENV", "production")
    response = client.post("/auth/simulate-payment", json={"email": test_user.email})
    assert response.status_code == 403

def test_register_simple_success(client, db_session):
    """Testa sucesso no registro simplificado."""
    email = f"simple_{os.urandom(4).hex()}@example.com"
    response = client.post("/auth/register-simple", json={
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 201
    assert response.json()["email"] == email

def test_register_with_files_success(client, db_session, monkeypatch):
    """Testa registro completo com ficheiros simbólicos."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io
    
    # Mock do save_upload_file para não gravar no disco real
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", lambda f, d: ("/tmp/fake.pdf", 1024))
    
    payload = {
        "email": f"full_{os.urandom(4).hex()}@example.com",
        "password": "password123",
        "legal_name": "Full Assets LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "Full Owner",
        "cpf": generate_valid_cpf()
    }
    
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"fake pdf content"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"fake pdf content"), "application/pdf")
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    assert response.status_code == 201
    assert "access_token" in response.json()
