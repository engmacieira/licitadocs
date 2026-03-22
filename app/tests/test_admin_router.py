import os
import pytest
from fastapi import status
from app.models.user_model import UserRole
from app.tests.conftest import generate_valid_cnpj

def test_admin_list_companies_success(client, db_session):
    """Valida que Admin pode listar empresas."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    from app.models.user_model import User
    
    admin_email = f"admin_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/admin/companies", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_admin_delete_company_soft_delete(client, db_session, test_company):
    """Protocolo Soft Delete: Admin deleta empresa e valida marcação no banco."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    from app.models.company_model import Company
    
    from app.models.company_model import Company
    
    admin_email = f"admin_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Deleta via Admin Router
    response = client.delete(f"/admin/companies/{test_company.id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # 2. Valida no DB
    db_session.expire_all()
    deleted_company = db_session.query(Company).filter_by(id=test_company.id).first()
    assert deleted_company is not None
    assert deleted_company.deleted_at is not None

def test_admin_toggle_company_status(client, db_session, test_company):
    """Valida ativação/bloqueio de empresa pelo Admin."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    from app.models.user_model import User
    
    admin_email = f"admin_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.patch(f"/admin/companies/{test_company.id}/toggle-status", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert "is_active" in response.json()
def test_admin_companies_error_cases(client, db_session):
    """Testa casos de erro (404/400) no Admin Router."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    admin_email = f"admin_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 404: Busca empresa inexistente
    response = client.get("/admin/companies/non_existent", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # 404: Atualiza empresa inexistente
    response = client.put("/admin/companies/non_existent", headers=headers, json={"razao_social": "Erro"})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # 404: Deleta empresa inexistente
    response = client.delete("/admin/companies/non_existent", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

    # 400: Cria empresa com CNPJ duplicado
    # Primeiro cria uma empresa
    from app.tests.conftest import generate_valid_cnpj
    cnpj = generate_valid_cnpj()
    client.post("/admin/companies", headers=headers, json={
        "cnpj": cnpj, "razao_social": "Empresa Original", "owner_id": str(admin.id)
    })
    
    # Tenta criar de novo com o mesmo CNPJ
    response = client.post("/admin/companies", headers=headers, json={
        "cnpj": cnpj, "razao_social": "Empresa Duplicada", "owner_id": str(admin.id)
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_admin_document_management(client, db_session, test_company):
    """Testa upload e download administrativo de documentos."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    admin_email = f"admin_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Listagem de documentos (vazia ou não)
    response = client.get(f"/admin/companies/{test_company.id}/documents", headers=headers)
    assert response.status_code == 200
    
    # 2. Upload Administrativo
    import io
    file_content = b"Conteudo do PDF administrativo"
    file = ("admin_test.pdf", io.BytesIO(file_content), "application/pdf")
    
    response = client.post(
        f"/admin/companies/{test_company.id}/upload",
        headers=headers,
        files={"file": file}
    )
    assert response.status_code == status.HTTP_201_CREATED
    doc_id = response.json()["id"]
    
    # 3. Download Administrativo
    response = client.get(f"/admin/companies/{test_company.id}/documents/{doc_id}/download", headers=headers)
    assert response.status_code == 200
    
    # 4. Erros no download
    response = client.get(f"/admin/companies/{test_company.id}/documents/non_existent/download", headers=headers)
    assert response.status_code == 404
