import pytest
from fastapi import status
from app.models.user_model import UserRole

def test_admin_stats_success(client, db_session):
    """Valida as estatísticas globais para o administrador."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    admin_email = "admin_dash@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/dashboard/admin/stats", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_companies" in data
    assert "total_users" in data
    assert "total_documents" in data

def test_client_stats_success(client, auth_headers, test_company):
    """Valida as estatísticas da empresa para o cliente."""
    response = client.get(f"/dashboard/client/stats?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["company_name"] == test_company.razao_social
    assert "total_docs" in data

def test_client_stats_forbidden(client, auth_headers):
    """Valida que o cliente não acessa estatísticas de outra empresa."""
    import uuid
    fake_cid = str(uuid.uuid4())
    response = client.get(f"/dashboard/client/stats?company_id={fake_cid}", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
