from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.dependencies import get_current_user
from unittest.mock import patch
import io
from fastapi import status
import pytest

#client = TestClient(app)

def test_upload_document_success(client, db_session: Session):
    """
    Cenário: Upload de um PDF válido por um ADMIN.
    """
    # 1. Setup: Criar Empresa
    company = Company(razao_social="Empresa Teste", cnpj="12345678000199")
    db_session.add(company)
    db_session.commit()

    # 2. Criar ADMIN (Único que pode fazer upload agora)
    admin_user = User(
        email="admin_uploader@teste.com", 
        password_hash="pw", 
        is_active=True, 
        role=UserRole.ADMIN.value
    )
    db_session.add(admin_user)
    db_session.commit()
    
    link = UserCompanyLink(
        user_id=admin_user.id, 
        company_id=company.id, 
        role=UserCompanyRole.MASTER.value,
        is_active=True
    )
    db_session.add(link)
    db_session.commit()

    # 3. Bypass Auth como Admin
    app.dependency_overrides[get_current_user] = lambda: admin_user

    # 4. Arquivo Fake
    file_obj = io.BytesIO(b"%PDF-1.4 fake content")
    
    try:
        with patch("app.routers.document_router.save_file_locally") as mock_save:
            mock_save.return_value = "storage/uploads/fake-uuid.pdf"

            response = client.post(
                "/documents/upload",
                files={"file": ("contrato.pdf", file_obj, "application/pdf")},
                data={
                    "title": "Contrato Social",
                    "expiration_date": "2026-12-31",
                    "target_company_id": company.id # Admin deve informar a empresa destino
                },
                headers={} 
            )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["filename"] == "contrato.pdf"

    finally:
        del app.dependency_overrides[get_current_user]

def test_upload_invalid_extension(client, db_session: Session):
    """
    Cenário: Tentar enviar .txt deve falhar com 400.
    OBS: Precisa ser ADMIN para chegar na validação da extensão.
    """
    company = Company(razao_social="Empresa Fail", cnpj="99988877000100")
    db_session.add(company)
    db_session.commit()

    # User precisa ser ADMIN para passar da barreira do 403
    admin_user = User(
        email="admin_fail@test.com", 
        password_hash="pw", 
        role=UserRole.ADMIN.value, 
        is_active=True
    )
    db_session.add(admin_user)
    db_session.commit()
    
    link = UserCompanyLink(user_id=admin_user.id, company_id=company.id, role="MASTER")
    db_session.add(link)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin_user

    try:
        response = client.post(
            "/documents/upload",
            files={"file": ("wrong.txt", io.BytesIO(b"txt"), "text/plain")},
            data={
                "title": "Arquivo Texto", # <--- [CORREÇÃO] Adicionado Title
                "target_company_id": company.id
            }
        )
        assert response.status_code == 400
        assert "PDF" in response.json()["detail"]
    finally:
        del app.dependency_overrides[get_current_user]

def test_list_documents(client, db_session: Session):
    """
    Cenário: Listar documentos deve retornar array.
    """
    company = Company(razao_social="Lista Ltd", cnpj="11122233000199")
    db_session.add(company)
    db_session.commit()
    
    # Admin para fazer o upload de setup
    admin = User(email="admin_setup@test.com", password_hash="pw", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    
    # Cliente para testar a listagem
    client_user = User(email="list@test.com", password_hash="pw", role=UserRole.CLIENT.value, is_active=True)
    db_session.add(client_user)
    db_session.commit()
    
    link = UserCompanyLink(user_id=client_user.id, company_id=company.id, role="VIEWER", is_active=True)
    db_session.add(link)
    db_session.commit()

    try:
        # 1. Admin faz o upload
        app.dependency_overrides[get_current_user] = lambda: admin
        
        file_obj = io.BytesIO(b"%PDF-1.4 conteudo")
        with patch("app.routers.document_router.save_file_locally") as mock_save:
            mock_save.return_value = "storage/dummy.pdf"
            client.post(
                "/documents/upload",
                files={"file": ("lista.pdf", file_obj, "application/pdf")},
                data={
                    "title": "Doc para Listagem", # <--- [CORREÇÃO] Adicionado Title
                    "target_company_id": company.id
                }
            )

        # 2. Cliente tenta listar (Agora sim deve funcionar e ver o arquivo)
        app.dependency_overrides[get_current_user] = lambda: client_user
        
        response = client.get("/documents/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["filename"] == "lista.pdf"
    finally:
        del app.dependency_overrides[get_current_user]

def test_admin_upload_for_client(client, db_session: Session):
    """
    Cenário: Admin faz upload para outra empresa.
    """
    admin = User(email="admin@boss.com", password_hash="pw", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    
    company = Company(razao_social="Alvo Ltda", cnpj="55555555000155")
    db_session.add(company)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: admin

    file_obj = io.BytesIO(b"%PDF-1.4 content")
    
    try:
        with patch("app.routers.document_router.save_file_locally") as mock_save:
            mock_save.return_value = "storage/admin.pdf"

            response = client.post(
                "/documents/upload",
                files={"file": ("doc.pdf", file_obj, "application/pdf")},
                data={
                    "title": "Upload Admin", # <--- [CORREÇÃO] Adicionado Title
                    "target_company_id": company.id
                }
            )

        assert response.status_code == 201
    finally:
        del app.dependency_overrides[get_current_user]