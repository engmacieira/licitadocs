import pytest
from fastapi import status

def test_read_users_me(client, auth_headers, test_user):
    """Valida a obtenção do perfil do próprio usuário."""
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert "password_hash" not in data

def test_update_user_me(client, auth_headers, test_user):
    """Valida a atualização do perfil do próprio usuário."""
    new_nome = "Updated Name"
    payload = {"nome": new_nome}
    response = client.patch("/users/me", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["nome"] == new_nome

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
