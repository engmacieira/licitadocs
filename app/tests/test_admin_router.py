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
    db_session.refresh(admin)
    
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
    db_session.refresh(admin)
    db_session.refresh(test_company)
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Deleta via Admin Router
    response = client.delete(f"/admin/companies/{test_company.id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # 2. Valida no DB
    db_session.expire_all()
    # Como o repositório aplica Soft Delete no query filter, 
    # precisamos buscar no banco ignorando o filtro padrão se houvesse, 
    # mas o teste usa db_session.query(Company) diretamente.
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
    db_session.refresh(admin)
    db_session.refresh(test_company)
    
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
    response = client.put("/admin/companies/non_existent", headers=headers, json={"name": "Erro"})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # 404: Deleta empresa inexistente
    response = client.delete("/admin/companies/non_existent", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

    # 400: Cria empresa com CNPJ duplicado
    # Primeiro cria uma empresa
    from app.tests.conftest import generate_valid_cnpj
    cnpj = generate_valid_cnpj()
    client.post("/admin/companies", headers=headers, json={
        "cnpj": cnpj, "name": "Empresa Original", "owner_id": str(admin.id)
    })
    
    # Tenta criar de novo com o mesmo CNPJ
    response = client.post("/admin/companies", headers=headers, json={
        "cnpj": cnpj, "name": "Empresa Duplicada", "owner_id": str(admin.id)
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
    
    from unittest.mock import patch
    with patch("app.routers.admin_router.save_upload_file") as mock_save:
        async def mock_coro(*args, **kwargs):
            return ("vault/admin_doc.pdf", 1024)
        mock_save.side_effect = mock_coro
        
        response = client.post(
            f"/admin/companies/{test_company.id}/upload",
            files={"file": file},
            headers=headers
        )
    assert response.status_code == status.HTTP_201_CREATED
    doc_id = response.json()["id"]
    
    # 3. Download Administrativo
    with patch("app.utils.file_helper.get_file_url") as mock_get_url:
        async def mock_coro(*args, **kwargs):
            return "http://mock-url.com/doc.pdf"
        mock_get_url.side_effect = mock_coro
        response = client.get(f"/admin/companies/{test_company.id}/documents/{doc_id}/download", headers=headers, follow_redirects=False)
    assert response.status_code == 307
    
    # 4. Erros no download
    response = client.get(f"/admin/companies/{test_company.id}/documents/non_existent/download", headers=headers)
    assert response.status_code == 404

def test_admin_upload_restrictions_malware_dos_vulnerability(client, db_session, test_company):
    """Testa restrições de upload (extensão e tamanho) na rota administrativa."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    import io
    
    admin_email = f"admin_up_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Tenta enviar arquivo .exe (deve ser barrado)
    file_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00\x00\x00"
    file = ("malware.exe", io.BytesIO(file_content), "application/x-msdownload")
    response = client.post(
        f"/admin/companies/{test_company.id}/upload",
        headers=headers,
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Tenta enviar arquivo maior que 5MB (deve ser barrado)
    large_content = b"0" * ((5 * 1024 * 1024) + 1)
    file_large = ("large.pdf", io.BytesIO(large_content), "application/pdf")
    response = client.post(
        f"/admin/companies/{test_company.id}/upload",
        headers=headers,
        files={"file": file_large}
    )
    assert response.status_code == status.HTTP_413_CONTENT_TOO_LARGE

def test_admin_toggle_company_status_not_owner(client, db_session, test_company):
    """
    Testa se desativar a empresa não afeta o dono se ele tiver outras empresas.
    Cria Empresa B do mesmo dono e valida que o dono e Empresa B continuam ativos.
    """
    from app.core.security import create_access_token
    from app.models.user_model import User
    from app.models.company_model import Company
    
    admin_email = f"admin_tog_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    
    # Criar uma segunda empresa para o mesmo dono de test_company
    from app.tests.conftest import generate_valid_cnpj
    owner_id = test_company.owner_id
    company_b = Company(
        cnpj=generate_valid_cnpj(),
        razao_social="Empresa B",
        owner_id=owner_id,
        is_active=True
    )
    db_session.add(company_b)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Admin desativa Empresa A (test_company)
    response = client.patch(f"/admin/companies/{test_company.id}/toggle-status", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_active"] is False
    
    # Valida no banco as propriedades
    db_session.expire_all()
    owner = db_session.query(User).filter_by(id=owner_id).first()
    comp_a = db_session.query(Company).filter_by(id=test_company.id).first()
    comp_b = db_session.query(Company).filter_by(id=company_b.id).first()
    
    assert comp_a.is_active is False
    assert comp_b.is_active is True
    assert owner.is_active is True  # O dono precisa continuar ativo

def test_admin_download_document_idor_vulnerability(client, db_session, test_company):
    """Testa se um arquivo pertencente à empresa A pode ser baixado usando a URL da empresa B (IDOR)."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    from app.models.company_model import Company
    from app.models.document_model import Document
    import io

    # 1. Criar empresa B e documento para empresa A
    from app.tests.conftest import generate_valid_cnpj
    company_b = Company(
        cnpj=generate_valid_cnpj(),
        razao_social="Empresa B",
        is_active=True
    )
    db_session.add(company_b)
    
    # Documento real para Empresa A
    doc_a = Document(
        company_id=test_company.id,
        title="Doc Emp A",
        filename="dummy_a.pdf",
        file_path="dummy_path_a"
    )
    db_session.add(doc_a)
    
    admin_email = f"admin_idor_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Admin tenta baixar Doc_A através da rota da Company_B
    response = client.get(f"/admin/companies/{company_b.id}/documents/{doc_a.id}/download", headers=headers)
    # Como document_repository.get_file_path agora valida company_id, deve retornar 404/403
    assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]

def test_admin_list_companies_pagination_dos_vulnerability(client, db_session):
    """Testa se valores absurdos em paginação são bloqueados (Mitigação de DoS)."""
    from app.core.security import create_access_token
    from app.models.user_model import User
    
    admin_email = f"admin_dos_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Request com limit acima do max_limit
    response = client.get("/admin/companies?limit=1000000", headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
