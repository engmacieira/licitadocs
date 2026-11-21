import pytest
from fastapi import status

def test_read_users_me(client, auth_headers, test_user):
    """Valida a obtenção do perfil do próprio usuário."""
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert "password_hash" not in data

def test_update_user_me_profile_only(client, auth_headers, test_user):
    """Valida que atualização de campos comuns NÃO exige senha atual."""
    new_nome = "Updated Name"
    payload = {"nome": new_nome}
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["nome"] == new_nome

def test_update_user_me_ignores_password(client, auth_headers, test_user, db_session):
    """Valida que PATCH /users/me ignora e não altera a senha se enviada."""
    from app.core.security import verify_password
    old_hash = test_user.password_hash
    payload = {
        "nome": "Profile Only",
        "password": "newpassword123",
        "current_password": "password123"
    }
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["nome"] == "Profile Only"
    db_session.refresh(test_user)
    assert test_user.password_hash == old_hash
    assert verify_password("password123", test_user.password_hash)

def test_update_user_me_password_missing_current_fails(client, auth_headers, test_user):
    """Valida que trocar a senha em /users/me/password EXIGE current_password."""
    payload = {"new_password": "newpassword123"}
    response = client.patch("/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

def test_update_user_me_password_wrong_current_fails(client, auth_headers, test_user):
    """Valida que trocar a senha falha com current_password incorreta."""
    payload = {
        "new_password": "newpassword123",
        "current_password": "wrongpassword"
    }
    response = client.patch("/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorreta" in response.json()["detail"].lower()

def test_update_user_me_password_success(client, auth_headers, test_user):
    """Valida o Happy Path da troca de senha em /users/me/password."""
    payload = {
        "new_password": "newpassword123",
        "current_password": "password123"
    }
    response = client.patch("/users/me/password", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Senha atualizada com sucesso."

def test_read_my_companies_empty(client, auth_headers):
    """Valida listagem de empresas quando o usuário não tem nenhuma."""
    response = client.get("/users/me/companies", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_read_my_companies_with_data(client, auth_headers, test_company):
    """Valida listagem de empresas vinculadas."""
    # test_company is already linked to test_user in conftest
    response = client.get("/users/me/companies", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["razao_social"] == test_company.razao_social
