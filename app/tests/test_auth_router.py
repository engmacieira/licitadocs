import pytest
import os
from fastapi import status
from app.core.security import get_password_hash
from app.models.user_model import User
from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf

@pytest.mark.asyncio
async def test_register_success(client, db_session, monkeypatch, mock_email_service):
    """Valida o Happy Path do registro completo (Onboarding)."""
    import io
    async def fake_save(f, d): return (f"/tmp/fake_{f.filename}", 1024)
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", fake_save)

    payload = {
        "email": "newuser@example.com",
        "password": "strongpassword",
        "legal_name": "New Company LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "John Doe",
        "cpf": generate_valid_cpf()
    }
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    
    # Validações do Negócio
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    
    # 2. SE QUISER VALIDAR OS EMAILS, USE A FIXTURE INJETADA!
    # Na refatoração foi definido que e-mail de alerta não é sempre enviado no momento do register.
    assert mock_email_service["verify"].called

@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user, monkeypatch):
    """Teste de constraint: impede e-mail duplicado."""
    import io
    async def fake_save(f, d): return (f"/tmp/fake_{f.filename}", 1024)
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", fake_save)

    payload = {
        "email": test_user.email,
        "password": "password123",
        "legal_name": "Another Company",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "Jane Doe",
        "cpf": generate_valid_cpf()
    }
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    response = client.post("/auth/register", data=payload, files=files)
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
        cpf=generate_valid_cpf()
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
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "No One",
        "cpf": generate_valid_cpf()
    }
    response = client.post("/auth/register", data=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

@pytest.mark.asyncio
async def test_register_error_cases(client, db_session, test_user, monkeypatch):
    """Testa erros no processo de registro."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io
    async def fake_save(f, d): return (f"/tmp/fake_{f.filename}", 1024)
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", fake_save)

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
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    response = client.post("/auth/register", data=payload, files=files)
    assert response.status_code == 400
    assert "E-mail já cadastrado" in response.json()["detail"]
    
    # CNPJ já cadastrado
    cnpj_repetido = generate_valid_cnpj()
    # Primeiro registra um
    payload["email"] = f"other_{os.urandom(2).hex()}@example.com"
    payload["cnpj"] = cnpj_repetido
    payload["cpf"] = generate_valid_cpf()
    client.post("/auth/register", data=payload, files=files)
    
    # Tenta de novo com mesmo CNPJ
    payload["email"] = f"another_{os.urandom(2).hex()}@example.com"
    payload["cpf"] = generate_valid_cpf()
    response = client.post("/auth/register", data=payload, files=files)
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

def test_register_simple_unauthenticated(client):
    """Valida que POST /register-simple retorna 401 sem autenticação."""
    response = client.post("/auth/register-simple", json={
        "email": "hacker@example.com",
        "password": "any"
    })
    assert response.status_code == 401

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

def test_register_simple_forbidden(client, test_user):
    """Valida que POST /register-simple retorna 403 para usuário não-admin."""
    from app.core.security import create_access_token
    from datetime import timedelta
    token = create_access_token(
        data={"sub": test_user.email, "role": test_user.role, "user_id": test_user.id},
        expires_delta=timedelta(minutes=15)
    )
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/auth/register-simple", json={
        "email": "hacker@example.com",
        "password": "any"
    }, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_register_with_mandatory_files_success(client, db_session, monkeypatch):
    """Valida que o registro funciona com os 3 PDFs obrigatórios, mesmo sem o opcional."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io
    
    async def fake_save(f, d): return (f"/tmp/fake_{f.filename}", 1024)
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", fake_save)
    
    payload = {
        "email": f"mand_{os.urandom(4).hex()}@example.com",
        "password": "password123",
        "legal_name": "Mandatory LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "Mandatory Owner",
        "cpf": generate_valid_cpf()
    }
    
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    assert response.status_code == 201
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_register_missing_mandatory_files_fails(client, db_session, monkeypatch):
    """Valida que o registro falha se faltar algum dos 3 PDFs obrigatórios."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io

    payload = {
        "email": f"missing_file_{os.urandom(4).hex()}@example.com",
        "password": "password123",
        "legal_name": "Missing File LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "Missing File Owner",
        "cpf": generate_valid_cpf()
    }

    # Faltando 'responsible_doc'
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }

    response = client.post("/auth/register", data=payload, files=files)
    # FastAPI retorna 422 para campos obrigatórios faltando no Form
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_register_phantom_disk_leak(client, db_session, monkeypatch):
    """Valida se ocorreu rollback e os.remove dos arquivos em caso de falha."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io
    
    saved_paths = []
    
    call_count = {"count": 0}
    
    async def fake_save_upload_fail_on_3(upload_file, dest):
        call_count["count"] += 1
        if call_count["count"] == 3:
            raise Exception("Simulated DB or File Error")
        path = f"companies/fake_{upload_file.filename}"
        saved_paths.append(path)
        return (path, 1024)
        
    removed_paths = []
    def fake_remove(path):
        removed_paths.append(path)
        
    monkeypatch.setattr("app.routers.auth_router.save_upload_file", fake_save_upload_fail_on_3)
    monkeypatch.setattr("app.routers.auth_router.delete_file", fake_remove)
    
    payload = {
        "email": f"leak_{os.urandom(4).hex()}@example.com",
        "password": "password123",
        "legal_name": "Leak LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "Leak Owner",
        "cpf": generate_valid_cpf()
    }
    
    files = {
        "social_contract": ("contract.pdf", io.BytesIO(b"%PDF-1.4\nfake pdf 1"), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\nfake pdf 2"), "application/pdf"),
        "responsible_doc": ("rg.pdf", io.BytesIO(b"%PDF-1.4\nfake pdf 3"), "application/pdf"),
        "proxy_doc": ("proxy.pdf", io.BytesIO(b"%PDF-1.4\nfake pdf 4"), "application/pdf")
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    assert response.status_code == 500
    
    # Com asyncio.gather, as tarefas são iniciadas concorrentemente.
    # Algumas podem terminar antes da falha da 3ª tarefa.
    assert len(saved_paths) >= 1
    assert len(removed_paths) == len(saved_paths)
    for path in saved_paths:
        assert path in removed_paths

def test_login_user_enumeration_mitigation(client, db_session, test_user, monkeypatch):
    """Valida se verify_password é chamado exatamente 1 vez, mesmo p/ usuário inexistente."""
    from unittest.mock import MagicMock
    
    mock_verify = MagicMock(return_value=False)
    monkeypatch.setattr("app.routers.auth_router.verify_password", mock_verify)
    
    client.post("/auth/token", data={"username": "naoexiste@example.com", "password": "any"})
    assert mock_verify.call_count == 1
    
    mock_verify.reset_mock()
    
    client.post("/auth/token", data={"username": test_user.email, "password": "wrong"})
    assert mock_verify.call_count == 1

@pytest.mark.asyncio
async def test_register_strict_file_validation(client, db_session):
    """Testa upload de .exe e arquivo MAIOR que 5MB."""
    from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf
    import io
    import os
    
    payload = {
        "email": f"file_{os.urandom(4).hex()}@example.com",
        "password": "password123",
        "legal_name": "File LTDA",
        "cnpj": generate_valid_cnpj(),
        "responsible_name": "File Owner",
        "cpf": generate_valid_cpf()
    }
    
    # 1. Testa Extensão Inválida (Enviando todos os arquivos obrigatórios para evitar 422)
    files_invalid_ext = {
        "social_contract": ("virus.exe", io.BytesIO(b"MZ..."), "application/x-msdownload"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    response_ext = client.post("/auth/register", data=payload, files=files_invalid_ext)
    # Agora deve retornar 400 da validate_file_security (ou logica do router)
    assert response_ext.status_code == 400
    assert "permitidos" in response_ext.json()["detail"]
    
    # 2. Testa Arquivo Grande (Enviando todos os arquivos obrigatórios)
    large_pdf_content = b"0" * (5 * 1024 * 1024 + 10)
    files_large = {
        "social_contract": ("contract.pdf", io.BytesIO(large_pdf_content), "application/pdf"),
        "cnpj_card": ("cnpj.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf"),
        "responsible_doc": ("id.pdf", io.BytesIO(b"%PDF-1.4\ncontent"), "application/pdf")
    }
    payload["email"] = f"large_{os.urandom(4).hex()}@example.com"
    payload["cnpj"] = generate_valid_cnpj()
    
    response_size = client.post("/auth/register", data=payload, files=files_large)
    assert response_size.status_code == 413
    assert "muito grande" in response_size.json()["detail"]
