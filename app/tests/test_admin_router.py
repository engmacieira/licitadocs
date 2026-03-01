"""
Testes de Integração de Rotas: Admin Router.
Cobre 100% das operações CRUD de empresas e gestão de ficheiros (upload/download),
com simulação de falhas de sistema para garantir a resiliência.
"""
from fastapi import status
from unittest.mock import patch, mock_open, MagicMock
import uuid

from app.models.company_model import Company
from app.models.user_model import User, UserRole
from app.models.document_model import Document
from app.core.security import get_password_hash

# ==========================================
# 🛡️ 1. TESTES DE SEGURANÇA E CRIAÇÃO (Já existentes)
# ==========================================

def test_create_company_unauthorized_public_user(client):
    payload = {"cnpj": "00000001000136", "razao_social": "Hacker S.A."}
    response = client.post("/admin/companies", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_company_success_admin(admin_client):
    payload = {"cnpj": "00.000.002/0001-80", "razao_social": "Empresa Legítima LTDA"}
    response = admin_client.post("/admin/companies", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["razao_social"] == "Empresa Legítima LTDA"

# ==========================================
# 🏢 2. TESTES DE CRUD DE EMPRESAS
# ==========================================

def test_update_company(db_session, admin_client):
    # Setup
    company = Company(cnpj="00000003000125", razao_social="Antiga S.A.")
    db_session.add(company)
    db_session.commit()

    # Ação
    response = admin_client.put(f"/admin/companies/{company.id}", json={"razao_social": "Nova S.A."})
    
    # Validação
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["razao_social"] == "Nova S.A."

def test_update_company_not_found(admin_client):
    response = admin_client.put(f"/admin/companies/{uuid.uuid4()}", json={"razao_social": "Fantasma"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_company(db_session, admin_client):
    company = Company(cnpj="00000004000170", razao_social="Para Deletar")
    db_session.add(company)
    db_session.commit()

    response = admin_client.delete(f"/admin/companies/{company.id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_company_not_found(admin_client):
    response = admin_client.delete(f"/admin/companies/{uuid.uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_company_details(db_session, admin_client):
    company = Company(cnpj="00000005000114", razao_social="Detalhes S.A.")
    db_session.add(company)
    db_session.commit()

    response = admin_client.get(f"/admin/companies/{company.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["razao_social"] == "Detalhes S.A."

def test_get_company_details_not_found(admin_client):
    response = admin_client.get(f"/admin/companies/{uuid.uuid4()}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

# ==========================================
# 🔒 3. TESTES DE STATUS (TOGGLE)
# ==========================================

def test_toggle_company_status_success(db_session, admin_client):
    # Setup: Empresa e Dono
    owner = User(email="dono@empresa.com", password_hash="123", is_active=True, role=UserRole.CLIENT.value)
    db_session.add(owner)
    db_session.commit()
    
    company = Company(cnpj="00000006000169", razao_social="Status S.A.", owner_id=owner.id)
    db_session.add(company)
    db_session.commit()

    # Ação: Desativar
    response = admin_client.patch(f"/admin/companies/{company.id}/toggle-status")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_active"] is False # O status inverteu!

def test_toggle_company_status_missing_owner(db_session, admin_client):
    # Setup: Empresa sem owner_id
    company = Company(cnpj="00000007000103", razao_social="Sem Dono S.A.")
    db_session.add(company)
    db_session.commit()

    response = admin_client.patch(f"/admin/companies/{company.id}/toggle-status")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Usuário dono não encontrado" in response.json()["detail"]

# ==========================================
# 📄 4. TESTES DE GESTÃO DE DOCUMENTOS
# ==========================================

def test_list_company_documents(db_session, admin_client):
    company = Company(cnpj="00000008000158", razao_social="Docs S.A.")
    db_session.add(company)
    db_session.commit()
    
    doc = Document(filename="teste.pdf", file_path="/fake/path", company_id=company.id)
    db_session.add(doc)
    db_session.commit()

    response = admin_client.get(f"/admin/companies/{company.id}/documents")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

@patch("app.routers.admin_router.shutil.copyfileobj")
@patch("builtins.open", new_callable=mock_open)
@patch("app.routers.admin_router.os.makedirs")
def test_upload_company_document_success(mock_makedirs, mock_open_file, mock_copy, db_session, admin_client):
    company = Company(cnpj="00000009000100", razao_social="Upload S.A.")
    db_session.add(company)
    db_session.commit()

    files = {"file": ("relatorio.pdf", b"%PDF...", "application/pdf")}
    response = admin_client.post(f"/admin/companies/{company.id}/upload", files=files)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["filename"] == "relatorio.pdf"
    mock_copy.assert_called_once() # Garante que simulou a cópia para o disco

@patch("builtins.open", side_effect=Exception("Disco falhou"))
@patch("app.routers.admin_router.os.makedirs")
def test_upload_company_document_disk_error(mock_makedirs, mock_open_file, db_session, admin_client):
    company = Company(cnpj="00000010000127", razao_social="Erro S.A.")
    db_session.add(company)
    db_session.commit()

    files = {"file": ("relatorio.pdf", b"123", "application/pdf")}
    response = admin_client.post(f"/admin/companies/{company.id}/upload", files=files)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Disco falhou" in response.json()["detail"]

def test_download_company_document_success(db_session, admin_client, tmp_path):
    """
    Cenário: Admin faz o download de um documento existente.
    Atenção QA: Em vez de fazer mock ao disco, criamos um ficheiro real temporário
    para a resposta FileResponse do FastAPI funcionar de verdade!
    """
    # 1. Setup: Criamos um ficheiro real na pasta temporária do Pytest
    ficheiro_falso = tmp_path / "baixar.pdf"
    ficheiro_falso.write_bytes(b"%PDF-1.4 Conteudo super secreto")
    
    company = Company(cnpj="00000011000171", razao_social="Download S.A.")
    db_session.add(company)
    db_session.commit()

    # Apontamos o caminho do documento para o nosso ficheiro temporário real
    doc = Document(filename="baixar.pdf", file_path=str(ficheiro_falso), company_id=company.id)
    db_session.add(doc)
    db_session.commit()

    # 2. Ação
    response = admin_client.get(f"/admin/companies/{company.id}/documents/{doc.id}/download")
    
    # 3. Validação (Testamos até se os bytes vieram corretos na rede!)
    assert response.status_code == status.HTTP_200_OK
    assert response.content == b"%PDF-1.4 Conteudo super secreto"

@patch("app.routers.admin_router.os.path.exists", return_value=False)
def test_download_company_document_missing_file(mock_exists, db_session, admin_client):
    """Cenário QA: O documento existe no Banco de Dados, mas o ficheiro foi apagado do disco!"""
    company = Company(cnpj="00000012000116", razao_social="Missing S.A.")
    db_session.add(company)
    db_session.commit()

    doc = Document(filename="sumiu.pdf", file_path="/mock/sumiu.pdf", company_id=company.id)
    db_session.add(doc)
    db_session.commit()

    response = admin_client.get(f"/admin/companies/{company.id}/documents/{doc.id}/download")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Arquivo físico não encontrado" in response.json()["detail"]

@patch("app.routers.admin_router.os.remove")
@patch("app.routers.admin_router.os.path.exists", return_value=True)
def test_delete_company_document_success(mock_exists, mock_remove, db_session, admin_client):
    company = Company(cnpj="00000013000160", razao_social="Del Doc S.A.")
    db_session.add(company)
    db_session.commit()

    doc = Document(filename="apagar.pdf", file_path="/mock/apagar.pdf", company_id=company.id)
    db_session.add(doc)
    db_session.commit()

    response = admin_client.delete(f"/admin/companies/{company.id}/documents/{doc.id}")
    
    assert response.status_code == status.HTTP_200_OK
    mock_remove.assert_called_once() # Garante que chamou a função de deletar no disco