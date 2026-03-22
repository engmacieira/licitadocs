import pytest
from fastapi import status
from app.models.user_model import UserRole, UserCompanyRole
from app.repositories.company_repository import CompanyRepository

def test_get_company_by_id_success(client, auth_headers, test_company):
    """Valida o Happy Path de obter detalhes de uma empresa."""
    response = client.get(f"/companies/{test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(test_company.id)
    assert data["cnpj"] == test_company.cnpj

def test_update_company_success(client, auth_headers, test_company):
    """Valida o Happy Path de atualização de dados da empresa."""
    payload = {"razao_social": "New Social Name LTDA"}
    response = client.put(f"/companies/{test_company.id}", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["razao_social"] == "New Social Name LTDA"

def test_list_members(client, auth_headers, test_company):
    """Valida listagem de membros da empresa."""
    response = client.get(f"/companies/{test_company.id}/members", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["role"] == UserCompanyRole.MASTER.value

def test_add_member_success(client, auth_headers, test_company):
    """Valida convite/adição de novo membro."""
    payload = {
        "email": "newmember@example.com",
        "role": "VIEWER",
        "cpf": "12312312312"
    }
    response = client.post(f"/companies/{test_company.id}/members", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newmember@example.com"
    assert data["role"] == "VIEWER"

def test_company_soft_delete_protocol(client, auth_headers, test_company, db_session):
    """
    Protocolo Soft Delete: Valida que após deletar via repositório,
    a empresa é marcada com deleted_at e o router não a encontra mais.
    """
    # 1. Deleta a empresa via Repositório (Protocolo Soft Delete)
    CompanyRepository.delete(db_session, test_company.id)
    
    # 2. Verifica no banco que o registro AINDA EXISTE, mas com deleted_at preenchido
    db_session.expire_all() # Limpa cache do SQLAlchemy
    deleted_company = db_session.query(CompanyRepository.model).filter_by(id=test_company.id).first()
    assert deleted_company is not None
    assert deleted_company.deleted_at is not None
    
    # 3. Verifica que o Router (que usa Repository.get_by_id) NÃO a retorna mais
    response = client.get(f"/companies/{test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_companies_admin_only(client, auth_headers, test_user):
    """Valida restrição de acesso: apenas ADMIN pode listar todas as empresas."""
    # test_user is CLIENT by default
    response = client.get("/companies/", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_company_onboarding_steps(client, db_session, test_company, test_user):
    """Testa a atualização das etapas de onboarding."""
    db_session.refresh(test_user)
    from app.core.security import create_access_token
    import os
    token = create_access_token(data={"sub": test_user.email, "role": "client", "user_id": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Terms
    response = client.patch(f"/companies/{test_company.id}/onboarding-step?step=terms", headers=headers)
    assert response.status_code == 200
    
    # 2. Invalid step
    response = client.patch(f"/companies/{test_company.id}/onboarding-step?step=invalid", headers=headers)
    assert response.status_code == 400

def test_member_management_edge_cases(client, db_session, test_company, test_user):
    """Testa casos de borda na gestão de membros."""
    # Garante que os vínculos criados na fixture estão carregados no objeto
    db_session.refresh(test_user)
    
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": test_user.email, "role": "client", "user_id": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Adicionar membro que já existe
    from app.tests.conftest import generate_valid_cpf
    response = client.post(f"/companies/{test_company.id}/members", headers=headers, json={
        "email": test_user.email,
        "role": "VIEWER",
        "cpf": generate_valid_cpf()
    })
    assert response.status_code == 400
    assert "já faz parte" in response.json()["detail"]
    
    # 2. Remover a si próprio: 400
    response = client.delete(f"/companies/{test_company.id}/members/{test_user.id}", headers=headers)
    assert response.status_code == 400
    
    # 3. Alterar permissão própria: 400
    response = client.put(f"/companies/{test_company.id}/members/{test_user.id}", headers=headers, json={"role": "VIEWER"})
    assert response.status_code == 400
