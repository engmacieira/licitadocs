"""
Testes de Integração e Unidade: Roteador de Documentos.
Cobre 100% das lógicas de Upload (Legado vs Estruturado), Downloads físicos,
permissões (ACL) e o CRUD completo do Catálogo de Tipos e Categorias.
"""
from fastapi import status
from unittest.mock import patch, MagicMock
import uuid

from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛠️ HELPER: SETUP DE USUÁRIO E EMPRESA
# ==========================================

def setup_client_with_company(db_session):
    user = User(email="cliente_doc@teste.com", password_hash=get_password_hash("123"), role=UserRole.CLIENT.value, is_active=True)
    company = Company(cnpj="12345678000199", razao_social="Cofre S.A.")
    db_session.add(user)
    db_session.add(company)
    db_session.commit()
    
    link = UserCompanyLink(user_id=user.id, company_id=company.id, role=UserCompanyRole.MASTER.value, is_active=True)
    db_session.add(link)
    db_session.commit()
    
    token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})
    return company, user, token

# ==========================================
# 📂 1. TESTES DE LISTAGEM (GET /)
# ==========================================

def test_list_documents_admin_missing_company(admin_client):
    """Cenário: Admin tenta listar tudo sem especificar empresa (Prevenção de N+1)."""
    response = admin_client.get("/documents/")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Admins devem especificar o company_id" in response.json()["detail"]

@patch("app.routers.document_router.DocumentRepository.get_unified_by_company")
def test_list_documents_client_success(mock_get_unified, db_session, client):
    """Cenário: Cliente lista documentos da sua própria empresa."""
    company, user, token = setup_client_with_company(db_session)
    
    # CORREÇÃO: Adicionados os campos obrigatórios (status, created_at, is_structured)
    mock_get_unified.return_value = [{
        "id": "1", 
        "filename": "teste.pdf",
        "status": "valid",
        "created_at": "2023-01-01T00:00:00Z",
        "is_structured": False
    }]
    
    response = client.get(f"/documents/?company_id={company.id}", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    
def test_list_documents_client_forbidden(db_session, client):
    """Cenário QA [Segurança]: Cliente tenta espiar empresa alheia."""
    company, user, token = setup_client_with_company(db_session)
    empresa_alheia = str(uuid.uuid4())
    
    response = client.get(f"/documents/?company_id={empresa_alheia}", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == status.HTTP_403_FORBIDDEN

# ==========================================
# 🚀 2. TESTES DE UPLOAD INTELIGENTE
# ==========================================

def test_upload_forbidden_client(db_session, client):
    company, user, token = setup_client_with_company(db_session)
    files = {"file": ("hacker.pdf", b"123", "application/pdf")}
    response = client.post("/documents/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_upload_not_pdf(admin_client):
    files = {"file": ("virus.exe", b"123", "application/x-msdownload")}
    response = admin_client.post("/documents/upload", data={"target_company_id": "123"}, files=files)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Apenas PDFs" in response.json()["detail"]

def test_upload_missing_company(admin_client):
    files = {"file": ("doc.pdf", b"123", "application/pdf")}
    response = admin_client.post("/documents/upload", files=files)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "destino é obrigatório" in response.json()["detail"]

@patch("app.routers.document_router.save_file_locally", side_effect=Exception("Disco Cheio"))
def test_upload_disk_error(mock_save, admin_client):
    """Cenário QA [Resiliência]: Falha física no disco rígido."""
    files = {"file": ("doc.pdf", b"123", "application/pdf")}
    response = admin_client.post("/documents/upload", data={"target_company_id": "123"}, files=files)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Falha ao salvar arquivo no disco" in response.json()["detail"]

@patch("app.routers.document_router.save_file_locally", return_value="/tmp/fake.pdf")
@patch("app.routers.document_router.DocumentRepository.create_legacy")
def test_upload_legacy_success(mock_create_legacy, mock_save, admin_client):
    """Cenário: Upload clássico sem type_id."""
    mock_doc = MagicMock(id="1", title="Doc", filename="doc.pdf", status="valid", created_at="2023-01-01T00:00:00")
    mock_create_legacy.return_value = mock_doc
    
    files = {"file": ("doc.pdf", b"%PDF", "application/pdf")}
    data = {"target_company_id": "123", "title": "Meu Documento"}
    
    response = admin_client.post("/documents/upload", data=data, files=files)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["is_structured"] is False
    mock_create_legacy.assert_called_once()

@patch("app.routers.document_router.save_file_locally", return_value="/tmp/fake.pdf")
@patch("app.routers.document_router.DocumentRepository.create_certificate")
def test_upload_structured_success(mock_create_cert, mock_save, admin_client):
    """Cenário: Upload estruturado COM type_id (Sprint 17)."""
    mock_cert = MagicMock(id="2", filename="cert.pdf", status="valid", created_at="2023-01-01T00:00:00")
    mock_create_cert.return_value = mock_cert
    
    files = {"file": ("cert.pdf", b"%PDF", "application/pdf")}
    data = {"target_company_id": "123", "type_id": "tipo-alvara", "authentication_code": "XYZ"}
    
    response = admin_client.post("/documents/upload", data=data, files=files)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["is_structured"] is True
    assert response.json()["type_id"] == "tipo-alvara"
    mock_create_cert.assert_called_once()

# ==========================================
# 📥 3. TESTES DE DOWNLOAD
# ==========================================

@patch("app.routers.document_router.DocumentRepository.get_file_path", return_value=None)
def test_download_not_found_in_db(mock_get_path, admin_client):
    response = admin_client.get("/documents/123/download")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "não encontrado" in response.json()["detail"]

@patch("app.routers.document_router.os.path.exists", return_value=False)
@patch("app.routers.document_router.DocumentRepository.get_file_path", return_value="/mock/sumiu.pdf")
def test_download_not_found_on_disk(mock_get_path, mock_exists, admin_client):
    response = admin_client.get("/documents/123/download")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "físico não encontrado" in response.json()["detail"]

@patch("app.routers.document_router.DocumentRepository.get_file_path")
def test_download_success(mock_get_path, admin_client, tmp_path):
    """Cenário: Sucesso usando tmp_path para o FileResponse funcionar perfeitamente!"""
    arquivo_real = tmp_path / "alvara.pdf"
    arquivo_real.write_bytes(b"%PDF-1.4 Fake PDF")
    
    mock_get_path.return_value = str(arquivo_real)
    
    response = admin_client.get("/documents/123/download")
    assert response.status_code == status.HTTP_200_OK
    assert response.content == b"%PDF-1.4 Fake PDF"

# ==========================================
# 🗂️ 4. TESTES DE CATÁLOGO (CATEGORIAS E TIPOS)
# ==========================================

@patch("app.routers.document_router.DocumentRepository.get_all_categories_with_types", return_value=[])
def test_get_catalog_success(mock_get_catalog, admin_client):
    response = admin_client.get("/documents/types")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

@patch("app.routers.document_router.DocumentRepository.create_category")
def test_create_category_admin(mock_create, admin_client):
    mock_create.return_value = {"id": "1", "name": "Jurídico", "slug": "juridico", "order": 1}
    response = admin_client.post("/documents/categories", json={"name": "Jurídico", "slug": "juridico", "order": 1})
    assert response.status_code == status.HTTP_201_CREATED

@patch("app.routers.document_router.DocumentRepository.update_category", side_effect=ValueError("Slug duplicado"))
def test_update_category_value_error(mock_update, admin_client):
    """Cenário QA: Força um ValueError do Repositório para testar o bloco except (HTTP 400)."""
    response = admin_client.put("/documents/categories/1", json={"name": "Teste"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Slug duplicado" in response.json()["detail"]

@patch("app.routers.document_router.DocumentRepository.delete_category")
def test_delete_category(mock_delete, admin_client):
    response = admin_client.delete("/documents/categories/1")
    assert response.status_code == status.HTTP_204_NO_CONTENT

@patch("app.routers.document_router.DocumentRepository.create_type")
def test_create_type_admin(mock_create, admin_client):
    # CORREÇÃO: Adicionado slug e validity_days_default exigidos pelo Schema
    mock_create.return_value = {
        "id": "1", "name": "Alvará", "slug": "alvara", 
        "category_id": "cat1", "is_expirable": True, "validity_days_default": 365
    }
    payload = {
        "name": "Alvará", "slug": "alvara", 
        "category_id": "cat1", "is_expirable": True, "validity_days_default": 365
    }
    response = admin_client.post("/documents/types", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    
@patch("app.routers.document_router.DocumentRepository.update_type")
def test_update_type(mock_update, admin_client):
    # CORREÇÃO: Retornar o Schema completo no mock
    mock_update.return_value = {
        "id": "1", "name": "Alvará Modificado", "slug": "alvara-mod", 
        "category_id": "cat1", "is_expirable": True, "validity_days_default": 365
    }
    payload = {"name": "Alvará Modificado", "slug": "alvara-mod"}
    response = admin_client.put("/documents/types/1", json=payload)
    assert response.status_code == status.HTTP_200_OK
    
@patch("app.routers.document_router.DocumentRepository.delete_type")
def test_delete_type(mock_delete, admin_client):
    response = admin_client.delete("/documents/types/1")
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_catalog_forbidden_for_normal_user(db_session, client):
    """Cenário QA: Garante que a função `verify_admin_access` bloqueia usuários comuns em TUDO."""
    company, user, token = setup_client_with_company(db_session)
    headers = {"Authorization": f"Bearer {token}"}
    
    # CORREÇÃO: Enviar um payload VÁLIDO para passar pelo Pydantic e conseguir testar o 403 Forbidden!
    valid_cat = {"name": "X", "slug": "x", "order": 1}
    valid_type = {"name": "Y", "slug": "y", "category_id": "1", "validity_days_default": 0}
    
    assert client.post("/documents/categories", json=valid_cat, headers=headers).status_code == 403
    assert client.put("/documents/categories/1", json=valid_cat, headers=headers).status_code == 403
    assert client.delete("/documents/categories/1", headers=headers).status_code == 403
    
    assert client.post("/documents/types", json=valid_type, headers=headers).status_code == 403
    assert client.put("/documents/types/1", json=valid_type, headers=headers).status_code == 403
    assert client.delete("/documents/types/1", headers=headers).status_code == 403