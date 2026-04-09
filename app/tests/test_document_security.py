import pytest
import os
from io import BytesIO
from unittest.mock import patch, MagicMock
from fastapi import status
from app.models.certificate_model import CertificateStatus
from app.repositories.document_repository import DocumentRepository

@pytest.mark.asyncio
async def test_upload_invalid_magic_number(client, auth_headers, test_company):
    """Missão 1: Um upload com nome .pdf mas cujo conteúdo não inicia com %PDF- é rejeitado com erro 400 Bad Request."""
    file_content = b"NOT A PDF content"
    file = ("not_pdf.pdf", BytesIO(file_content), "application/pdf")
    
    response = client.post(
        f"/documents/upload?company_id={test_company.id}",
        data={"title": "test.pdf"},
        files={"file": file},
        headers=auth_headers
    )
    
    assert response.status_code == 400
    assert "não é um PDF válido" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_zombie_file_prevention(client, auth_headers, test_company, test_doc_type):
    """Missão 2: Se houver falha forçada (Mock) no create_certificate, a função os.remove é chamada para o arquivo recém-criado."""
    file_content = b"%PDF- valid header"
    file = ("zombie.pdf", BytesIO(file_content), "application/pdf")
    
    # Mock do save_upload_file para retornar um caminho conhecido (AsyncMock pois agora é awaitable)
    with patch("app.routers.document_router.save_upload_file", new_callable=MagicMock) as mock_save, \
         patch("app.repositories.document_repository.DocumentRepository.create_certificate") as mock_create, \
         patch("os.path.exists") as mock_exists, \
         patch("os.remove") as mock_remove:
        
        fake_path = "/tmp/fake_zombie.pdf"
        # O router agora espera um awaitable, então configuramos o return_value do mock como uma corrotina ou usamos AsyncMock
        async def mock_coro(*args, **kwargs):
            return (fake_path, 1024)
        mock_save.side_effect = mock_coro
        mock_create.side_effect = Exception("Repository Failure")
        mock_exists.return_value = True
        
        response = client.post(
            "/documents/upload",
            data={"type_id": test_doc_type.id, "target_company_id": test_company.id},
            files={"file": file},
            headers=auth_headers
        )
        
        assert response.status_code == 500
        # Verifica se o arquivo foi removido após a falha do repositório
        mock_remove.assert_called_once_with(fake_path)

@pytest.mark.asyncio
async def test_certificate_versioning_archiving(client, auth_headers, test_company, test_doc_type, db_session):
    """Missão 3: O upload de um novo FGTS (type_id mockado) altera o status do FGTS anterior da empresa para archived."""
    # 1. Cria a primeira certidão
    from app.models.certificate_model import Certificate
    cert1 = Certificate(
        type_id=test_doc_type.id,
        filename="old.pdf",
        file_path="/tmp/old.pdf",
        company_id=test_company.id,
        status=CertificateStatus.VALID.value
    )
    db_session.add(cert1)
    db_session.commit()
    
    # 2. Upload da segunda certidão
    file_content = b"%PDF- new cert"
    file = ("new.pdf", BytesIO(file_content), "application/pdf")
    
    response = client.post(
        "/documents/upload",
        data={"type_id": test_doc_type.id, "target_company_id": test_company.id},
        files={"file": file},
        headers=auth_headers
    )
    
    assert response.status_code == 201
    
    # 3. Verifica se a primeira foi arquivada
    db_session.expire_all()
    old_cert = db_session.query(Certificate).filter(Certificate.id == cert1.id).first()
    assert old_cert.status == CertificateStatus.ARCHIVED.value
    
    # 4. Verifica se a nova está PENDING (Regra Sprint 27: uploads via router agora iniciam como pending para conferência)
    new_cert_id = response.json()["id"]
    new_cert = db_session.query(Certificate).filter(Certificate.id == new_cert_id).first()
    assert new_cert.status == CertificateStatus.PENDING.value
