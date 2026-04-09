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

def test_update_user_me_password_missing_current_fails(client, auth_headers, test_user):
    """Valida que trocar a senha EXIGE current_password."""
    payload = {"password": "newpassword123"}
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "senha atual é obrigatória" in response.json()["detail"].lower()

def test_update_user_me_password_wrong_current_fails(client, auth_headers, test_user):
    """Valida que trocar a senha falha com current_password incorreta."""
    payload = {
        "password": "newpassword123",
        "current_password": "wrongpassword"
    }
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == 401
    assert "incorreta" in response.json()["detail"].lower()

def test_update_user_me_password_success(client, auth_headers, test_user):
    """Valida o Happy Path da troca de senha."""
    payload = {
        "password": "newpassword123",
        "current_password": "password123"
    }
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == 200

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
