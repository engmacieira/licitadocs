import pytest
import os
from fastapi import status
from app.models.user_model import UserRole, UserCompanyRole
from app.tests.conftest import generate_valid_cpf, generate_valid_cnpj

@pytest.fixture
def admin_user(db_session):
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    from app.models.user_model import UserRole
    
    email = f"admin_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="adminpassword",
        is_active=True,
        cpf=generate_valid_cpf(),
        rg="7654321",
        celular="11888888888",
        genero="F"
    )
    user = UserRepository.create_user(db_session, user_in)
    user.role = UserRole.ADMIN.value
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_headers(admin_user):
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": admin_user.email})
    return {"Authorization": f"Bearer {token}"}

# --- Misssão 1: Blindagem de Schemas ---

def test_cnpj_max_length_validation(client, admin_headers):
    """Teste de Rejeição de CNPJ gigante (ReDoS protection)."""
    payload = {
        "razao_social": "Giant CNPJ Test",
        "cnpj": "1" * 100 # Very long CNPJ
    }
    response = client.post("/admin/companies", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    # ReDoS protection: max_length=18 or validator caught it
    error_msg = str(response.json())
    assert "string_too_long" in error_msg or "CNPJ inválido" in error_msg

def test_invalid_cpf_validation(client, auth_headers, test_company):
    """Teste de Rejeição de CPF inválido."""
    payload = {
        "responsavel_cpf": "12345678900" # Invalid mathematical CPF
    }
    response = client.put(f"/companies/{test_company.id}", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "CPF inválido" in str(response.json())

# --- Missão 2: Fechar o Bypass de Pagamento ---

def test_onboarding_bypass_forbidden_for_master(client, auth_headers, test_company):
    """Teste do Bypass: Tentar chamar a rota de onboarding logado como MASTER (deve falhar com 403)."""
    # auth_headers is for test_user who is MASTER of test_company
    response = client.patch(f"/companies/{test_company.id}/onboarding-step?step=payment", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_onboarding_allowed_for_admin(client, admin_headers, test_company):
    """Garante que apenas ADMIN pode atualizar onboarding."""
    response = client.patch(f"/companies/{test_company.id}/onboarding-step?step=payment", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK

# --- Missão 3: Prevenção de Roubo de Identidade no Convite ---

def test_add_member_no_password_leak(client, auth_headers, test_company):
    """Verifica que o segredo/senha temporária não é retornado na resposta."""
    payload = {
        "email": f"new_secure_user_{os.urandom(2).hex()}@example.com",
        "role": "VIEWER",
        "cpf": generate_valid_cpf()
    }
    response = client.post(f"/companies/{test_company.id}/members", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "message" in data
    assert "Senha provisória" not in data["message"]
    assert data["message"] == "Conta criada. Instruções enviadas por e-mail."

# --- Missão 4: Prevenção de Motim ---

def test_mutiny_prevention(client, test_company, test_user, db_session):
    """Teste do 'Motim': Garante que o OWNER não pode ser removido ou despromovido por outro MASTER."""
    # 1. Create a second MASTER user
    from app.models.user_model import UserCompanyLink, UserCompanyRole
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    from app.core.security import create_access_token

    email = f"master_{os.urandom(2).hex()}@example.com"
    user_in = UserCreate(email=email, password="password", is_active=True, cpf=generate_valid_cpf())
    other_master = UserRepository.create_user(db_session, user_in)
    
    link = UserCompanyLink(user_id=other_master.id, company_id=test_company.id, role=UserCompanyRole.MASTER.value, is_active=True)
    db_session.add(link)
    db_session.commit()
    
    token = create_access_token(data={"sub": other_master.email})
    m_headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Try to delete the OWNER (test_user)
    response = client.delete(f"/companies/{test_company.id}/members/{test_user.id}", headers=m_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "criador da empresa não pode ser alterado ou removido" in response.json()["detail"]

    # 3. Try to demote the OWNER
    response = client.put(f"/companies/{test_company.id}/members/{test_user.id}", headers=m_headers, json={"role": "VIEWER"})
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "criador da empresa não pode ser alterado ou removido" in response.json()["detail"]
