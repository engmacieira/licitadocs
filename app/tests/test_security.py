import pytest
from fastapi import status
from datetime import timedelta, datetime, timezone
from jose import jwt
from app.core.security import SECRET_KEY, ALGORITHM, create_access_token
from app.models.user_model import User, UserCompanyLink, UserCompanyRole, UserRole
from app.models.document_model import Document
from app.repositories.document_repository import DocumentRepository
from app.tests.conftest import generate_valid_cpf, generate_valid_cnpj

@pytest.fixture
def user_a(db_session):
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    import os
    email = f"user_a_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="password123",
        is_active=True,
        cpf=generate_valid_cpf()
    )
    return UserRepository.create_user(db_session, user_in)

@pytest.fixture
def user_b(db_session):
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    import os
    email = f"user_b_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="password123",
        is_active=True,
        cpf=generate_valid_cpf()
    )
    return UserRepository.create_user(db_session, user_in)

@pytest.fixture
def company_a(db_session, user_a):
    from app.repositories.company_repository import CompanyRepository
    from app.schemas.company_schemas import CompanyCreate
    company = CompanyRepository.create(db_session, CompanyCreate(razao_social="Company A", cnpj=generate_valid_cnpj()))
    link = UserCompanyLink(user_id=user_a.id, company_id=company.id, role=UserCompanyRole.MASTER.value, is_active=True)
    db_session.add(link)
    db_session.commit()
    return company

@pytest.fixture
def company_b(db_session, user_b):
    from app.repositories.company_repository import CompanyRepository
    from app.schemas.company_schemas import CompanyCreate
    company = CompanyRepository.create(db_session, CompanyCreate(razao_social="Company B", cnpj=generate_valid_cnpj()))
    link = UserCompanyLink(user_id=user_b.id, company_id=company.id, role=UserCompanyRole.MASTER.value, is_active=True)
    db_session.add(link)
    db_session.commit()
    return company

@pytest.fixture
def token_a(user_a):
    return create_access_token(data={"sub": user_a.email})

@pytest.fixture
def token_b(user_b):
    return create_access_token(data={"sub": user_b.email})

# ==========================================
# 🛑 BOLA/IDOR (HORIZONTAL AUTHORIZATION)
# ==========================================

def test_bola_download_unauthorized(client, db_session, company_b, token_a):
    """Teste: Usuário A tenta baixar documento da Empresa B."""
    # Criar um documento para Empresa B
    doc_b = Document(
        title="Secret Doc B",
        filename="secret.pdf",
        file_path="storage/vault/secret_b.pdf",
        company_id=company_b.id,
        is_client_upload=True
    )
    db_session.add(doc_b)
    db_session.commit()

    # Tenta baixar como Usuário A
    response = client.get(
        f"/documents/{doc_b.id}/download",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    
    # Esperado: 403 Forbidden (Fix aplicado)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Acesso negado" in response.json()["detail"]

def test_bola_list_unauthorized(client, company_b, token_a):
    """Teste: Usuário A tenta listar documentos da Empresa B."""
    response = client.get(
        f"/documents/?company_id={company_b.id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_bola_delete_unauthorized(client, db_session, company_b, token_a):
    """Teste: Usuário A tenta eliminar documento da Empresa B."""
    doc_b = Document(
        title="Delete Me B",
        filename="delete.pdf",
        file_path="storage/vault/delete_b.pdf",
        company_id=company_b.id
    )
    db_session.add(doc_b)
    db_session.commit()

    response = client.delete(
        f"/documents/{doc_b.id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

# ==========================================
# 🔑 AUTHENTICATION & JWT MANIPULATION
# ==========================================

def test_jwt_missing_header(client):
    """Teste: Cabeçalho Authorization ausente."""
    response = client.get("/documents/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_jwt_expired(client, user_a):
    """Teste: Token JWT expirado."""
    expired_token = create_access_token(
        data={"sub": user_a.email},
        expires_delta=timedelta(minutes=-1)
    )
    response = client.get(
        "/documents/",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_jwt_invalid_signature(client, user_a):
    """Teste: Token com assinatura inválida (Fake Secret)."""
    payload = {"sub": user_a.email, "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
    invalid_token = jwt.encode(payload, "fake_secret_123", algorithm=ALGORITHM)
    
    response = client.get(
        "/documents/",
        headers={"Authorization": f"Bearer {invalid_token}"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_jwt_malformed(client):
    """Teste: Token malformado."""
    response = client.get(
        "/documents/",
        headers={"Authorization": "Bearer not-a-token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ==========================================
# 💉 SQL INJECTION & PAYLOAD VALIDATION
# ==========================================

@pytest.mark.parametrize("payload", [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "\" OR \"1\"=\"1",
    "admin' --",
    "1 UNION SELECT NULL, email, password_hash FROM users"
])
def test_sqli_query_params(client, token_a, payload):
    """Teste: Injeção SQL em query parameters."""
    # O Pydantic/FastAPI deve tratar a string literalmente e o SQLAlchemy usar bind parameters.
    # O esperado é que a API responda com 422 (se não validar UUID) ou 200/404/403 (sucesso sanitizado),
    # mas NUNCA 500 Internal Server Error.
    response = client.get(
        f"/companies/{payload}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR

def test_sqli_body_payload(client, token_a):
    """Teste: Injeção SQL no corpo da requisição (JSON)."""
    sqli_payload = {
        "razao_social": "Hacker Corp' OR 1=1 --",
        "cnpj": "00000000000000"
    }
    # Tenta atualizar uma empresa (ID qualquer, o importante é o payload)
    response = client.put(
        "/companies/some-id",
        json=sqli_payload,
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
