import pytest
from fastapi import status
from app.core.security import verify_password
from app.models.user_model import User

def test_password_update_success(client, test_user, auth_headers, db_session):
    """
    Test Mission 1: Atualização de senha com sucesso.
    Verifica se o hash mudou no banco e se o login com a nova senha funciona.
    """
    old_hash = test_user.password_hash
    new_password = "newpassword123"
    
    # 1. Atualiza a senha
    response = client.patch(
        "/users/me",
        json={"password": new_password},
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    
    # 2. Verifica se o hash mudou no banco
    db_session.refresh(test_user)
    assert test_user.password_hash != old_hash
    assert verify_password(new_password, test_user.password_hash)

    # 3. Tenta login com a nova senha (usando a rota de token)
    login_response = client.post(
        "/auth/token",
        data={"username": test_user.email, "password": new_password}
    )
    assert login_response.status_code == status.HTTP_200_OK
    assert "access_token" in login_response.json()

def test_cpf_validation_failure(client, test_user, auth_headers):
    """
    Test Mission 2: Tentativa de atualizar o CPF com valor inválido.
    Deve retornar 422 Unprocessable Entity.
    """
    invalid_cpf = "123"
    
    response = client.patch(
        "/users/me",
        json={"cpf": invalid_cpf},
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "11 dígitos" in response.json()["detail"][0]["msg"]

def test_mass_assignment_is_active_blocked(client, test_user, auth_headers, db_session):
    """
    Test Mission 3: Tentativa de enviar "is_active": false via PATCH /me.
    O status no banco deve continuar inalterado (True).
    """
    # Garante que o usuário está ativo inicialmente
    assert test_user.is_active is True
    
    # Tenta desativar a própria conta via mass assignment
    response = client.patch(
        "/users/me",
        json={"is_active": False},
        headers=auth_headers
    )
    
    # Como o campo foi removido do schema, o Pydantic o ignora (comportamento padrão)
    # ou o router o ignora explicitamente na blindagem.
    assert response.status_code == status.HTTP_200_OK
    
    # Recarrega do banco e valida que continua ativo
    db_session.refresh(test_user)
    assert test_user.is_active is True

def test_read_my_companies_clean_data(client, test_user, test_company, auth_headers):
    """
    Test Mission 4: Valida se o retorno de empresas está limpo (sem _sa_instance_state).
    """
    response = client.get("/users/me/companies", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    
    results = response.json()
    assert len(results) > 0
    
    company = results[0]
    # Atributos públicos esperados
    assert "id" in company
    assert "razao_social" in company
    assert "cnpj" in company
    assert "role" in company
    assert "status" in company
    
    # Atributos internos do SQLAlchemy que NÃO devem estar presentes
    assert "_sa_instance_state" not in company
