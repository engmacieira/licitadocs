import pytest
import os
from fastapi import status
from io import BytesIO
from app.models.document_model import DocumentStatus
from app.repositories.document_repository import DocumentRepository

def test_upload_document_success(client, auth_headers, test_company):
    """Valida o Happy Path de upload de documento."""
    file_content = b"test file content"
    file = ("test.pdf", BytesIO(file_content), "application/pdf")
    
    response = client.post(
        f"/documents/upload?company_id={test_company.id}",
        data={"title": "test.pdf"},
        files={"file": file},
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "test.pdf"
    assert data["company_id"] == str(test_company.id)

def test_get_document_in_list_success(client, auth_headers, test_company, db_session):
    """Valida o Happy Path de encontrar o documento na listagem."""
    # 1. Cria um documento via repo
    from app.models.document_model import Document
    doc = Document(
        title="Doc Teste",
        filename="teste.pdf",
        file_path="/tmp/teste.pdf",
        company_id=test_company.id,
        status=DocumentStatus.VALID.value
    )
    db_session.add(doc)
    db_session.commit()
    
    response = client.get(f"/documents/?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert any(d["id"] == str(doc.id) for d in data)

def test_delete_document_soft_delete(client, auth_headers, test_company, db_session):
    """
    Protocolo Soft Delete: Valida que a exclusão de um documento via Router
    não o remove do banco, apenas marca como deletado e o esconde da listagem.
    """
    # 1. Cria documento
    from app.models.document_model import Document
    doc = Document(
        title="Doc Para Deletar",
        filename="delete.pdf",
        file_path="/tmp/delete.pdf",
        company_id=test_company.id,
        status=DocumentStatus.VALID.value
    )
    db_session.add(doc)
    db_session.commit()
    
    # 2. Deleta via Router
    response = client.delete(f"/documents/{doc.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # 3. Valida no banco (Soft Delete: Registro AINDA EXISTE, mas com deleted_at)
    db_session.expire_all()
    deleted_doc = db_session.query(Document).filter_by(id=doc.id).first()
    assert deleted_doc is not None
    assert deleted_doc.deleted_at is not None
    
    # 4. Valida filtro (Listagem não deve retornar o documento deletado)
    response = client.get(f"/documents/?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert not any(d["id"] == str(doc.id) for d in response.json())

def test_list_documents_by_company(client, auth_headers, test_company, db_session):
    """Valida listagem de documentos de uma empresa."""
    from app.models.document_model import Document
    doc = Document(
        title="Lista Teste",
        filename="lista.pdf",
        file_path="/tmp/lista.pdf",
        company_id=test_company.id,
        status=DocumentStatus.VALID.value
    )
    db_session.add(doc)
    db_session.commit()

    response = client.get(f"/documents/?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert any(d["id"] == str(doc.id) for d in data)

# --- NOVOS TESTES DE COBERTURA (ROUTER) ---

def test_list_documents_admin_requirements(client, db_session):
    """Valida que Admin deve passar company_id."""
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    
    admin_email = "admin_doc@example.com"
    admin = User(email=admin_email, password_hash="h", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Sem company_id deve dar 400
    response = client.get("/documents/", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Admins devem especificar o company_id" in response.text

def test_upload_file_validations(client, auth_headers, test_company):
    """Valida extensões e tamanhos de arquivos."""
    # 1. Extensão inválida
    file_txt = ("test.txt", BytesIO(b"content"), "text/plain")
    res_ext = client.post(
        f"/documents/upload?company_id={test_company.id}",
        data={"title": "T"}, files={"file": file_txt}, headers=auth_headers
    )
    assert res_ext.status_code == 400
    assert "Apenas ficheiros PDF" in res_ext.text
    
    # 2. Arquivo muito grande (Simulado via Content-Length ou Mock se necessário, 
    # mas aqui o router faz a verificação manual com seek/tell)
    large_content = b"0" * (6 * 1024 * 1024) # 6MB
    file_large = ("large.pdf", BytesIO(large_content), "application/pdf")
    res_large = client.post(
        f"/documents/upload?company_id={test_company.id}",
        data={"title": "L"}, files={"file": file_large}, headers=auth_headers
    )
    assert res_large.status_code == 413

def test_upload_structured_with_alert(client, auth_headers, test_company, test_doc_type, db_session):
    """Valida upload de certidão com status irregular e criação de alerta."""
    from app.repositories.message_repository import MessageRepository
    
    file = ("cert.pdf", BytesIO(b"pdf content"), "application/pdf")
    response = client.post(
        "/documents/upload",
        data={
            "type_id": test_doc_type.id,
            "target_company_id": test_company.id,
            "status": "irregular",
            "notes": "Falta assinatura"
        },
        files={"file": file},
        headers=auth_headers
    )
    
    assert response.status_code == 201
    assert response.json()["status"] == "irregular"
    
    # Verifica se a mensagem de alerta foi criada
    msgs = MessageRepository.get_by_company(db_session, test_company.id)
    assert any("Alerta de Irregularidade" in m.subject for m in msgs)

def test_admin_monitoring_routes(client, db_session):
    """Valida rotas de monitoramento restritas a Admin."""
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    
    # 1. Usuário comum tentando acessar (403 via require_role)
    user_email = "common@example.com"
    user = User(email=user_email, password_hash="h", role=UserRole.CLIENT.value, is_active=True)
    db_session.add(user)
    db_session.commit()
    
    token_u = create_access_token(data={"sub": user_email, "role": UserRole.CLIENT.value})
    headers_u = {"Authorization": f"Bearer {token_u}"}
    
    assert client.get("/documents/expiring", headers=headers_u).status_code == 403
    assert client.get("/documents/irregular", headers=headers_u).status_code == 403
    
    # 2. Admin acessando (200)
    admin_email = "admin_mon@example.com"
    admin = User(email=admin_email, password_hash="h", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    token_a = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    assert client.get("/documents/expiring", headers=headers_a).status_code == 200
    assert client.get("/documents/irregular", headers=headers_a).status_code == 200

def test_download_document_edge_cases(client, auth_headers, test_company, db_session):
    """Valida erros de download."""
    # Documento inexistente
    assert client.get("/documents/invalid_id/download", headers=auth_headers).status_code == 404
    
    # Ficheiro físico não encontrado
    from app.models.document_model import Document
    doc = Document(title="X", filename="x.pdf", file_path="/non/existent/path", company_id=test_company.id)
    db_session.add(doc)
    db_session.commit()
    
    assert client.get(f"/documents/{doc.id}/download", headers=auth_headers).status_code == 404

def test_update_metadata_admin_only(client, auth_headers, test_company, db_session):
    """Valida que apenas admin atualiza metadados."""
    from app.models.document_model import Document
    doc = Document(title="Update", filename="u.pdf", file_path="/p", company_id=test_company.id)
    db_session.add(doc)
    db_session.commit()
    
    # Usuário comum (auth_headers vem de um test_user padrão)
    # Nota: require_role([ADMIN]) deve barrar
    payload = {"expiration_date": "2026-01-01", "status": "valid"}
    res = client.patch(f"/documents/{doc.id}", json=payload, headers=auth_headers)
    assert res.status_code == 403

def test_document_multi_tenant_security(client, db_session, test_user):
    """Valida bloqueio de acesso a documentos de outra empresa."""
    db_session.refresh(test_user)
    from app.core.security import create_access_token
    from app.models.company_model import Company
    from app.models.document_model import Document
    import os
    
    # 1. Cria outra empresa e um documento nela
    other_company = Company(cnpj="99999999000199", razao_social="Outra", owner_id=test_user.id)
    db_session.add(other_company)
    db_session.commit()
    
    doc = Document(title="Secreto", filename="s.pdf", file_path="/p", company_id=other_company.id)
    db_session.add(doc)
    db_session.commit()
    
    # 2. Usuário logado mas sem vínculo com a 'Outra' empresa
    token = create_access_token(data={"sub": test_user.email, "role": "client", "user_id": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Tenta listar (não deve ver o doc da outra empresa)
    response = client.get(f"/documents/?company_id={other_company.id}", headers=headers)
    assert response.status_code == 403
    
    # Tenta deletar
    response = client.delete(f"/documents/{doc.id}", headers=headers)
    assert response.status_code == 403

def test_upload_document_constraints(client, auth_headers, db_session, test_user, test_company):
    """Testa restrições de upload de documento (Formato e Tamanho)."""
    db_session.refresh(test_user)
    import io
    
    # 1. Formato inválido
    file = ("test.txt", io.BytesIO(b"txt content"), "text/plain")
    response = client.post(
        "/documents/upload", 
        headers=auth_headers, 
        files={"file": file},
        data={"company_id": str(test_company.id)}
    )
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]
    
    # 2. Admin enviando sem company_id
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    import os
    
    admin_email = f"admin_up_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="h", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    
    admin_token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    file_pdf = ("test.pdf", io.BytesIO(b"pdf content"), "application/pdf")
    response = client.post("/documents/upload", headers=admin_headers, files={"file": file_pdf})
    assert response.status_code == 400
    assert "Admins devem enviar" in response.json()["detail"]

def test_document_not_found_on_update_delete(client, db_session):
    """Testa erro 404 ao atualizar ou deletar documento inexistente."""
    from app.core.security import create_access_token
    from app.models.user_model import User, UserRole
    # Criar Admin
    admin_email = f"admin_nf_{os.urandom(4).hex()}@example.com"
    admin = User(email=admin_email, password_hash="h", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    db_session.commit()
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}

    # PATCH
    response = client.patch("/documents/non_existent", json={"status": "valid"}, headers=headers)
    assert response.status_code == 404
    
    # DELETE
    response = client.delete("/documents/non_existent", headers=headers)
    assert response.status_code == 404

def test_catalog_endpoints(client, auth_headers):
    """Testa endpoint de catálogo de tipos."""
    # Tipos (Contém as categorias agrupadas)
    response = client.get("/documents/types", headers=auth_headers)
    assert response.status_code == 200

# ==========================================
# 📦 TESTES DE EXPORTAÇÃO EM LOTE (ZIP)
# ==========================================

def test_export_valid_documents_zip_success(client, auth_headers, test_company, db_session, tmp_path):
    """Valida a exportação em lote (Happy Path): Arquivos corretos, ignorando expirados e renomeando duplicados."""
    from app.models.document_model import Document, DocumentStatus
    import zipfile
    import io

    # 1. Criar arquivos físicos temporários reais para o teste
    file1_path = tmp_path / "teste1.pdf"
    file1_path.write_text("conteudo pdf 1")

    file2_path = tmp_path / "teste2.pdf"
    file2_path.write_text("conteudo pdf 2")

    # 2. Inserir no banco de dados
    doc_valido = Document(
        title="Doc Válido 1", filename="documento.pdf", file_path=str(file1_path),
        company_id=test_company.id, status=DocumentStatus.VALID.value
    )
    # Mesmo nome de arquivo para testar a inteligência de renomeação do script
    doc_warning = Document(
        title="Doc Válido 2", filename="documento.pdf", file_path=str(file2_path), 
        company_id=test_company.id, status=DocumentStatus.WARNING.value
    )
    # Status Expirado (Não deve entrar no ZIP)
    doc_expirado = Document(
        title="Doc Expirado", filename="velho.pdf", file_path=str(file1_path),
        company_id=test_company.id, status=DocumentStatus.EXPIRED.value 
    )

    db_session.add_all([doc_valido, doc_warning, doc_expirado])
    db_session.commit()

    # 3. Chamar a rota
    response = client.get(f"/documents/export/zip?company_id={test_company.id}", headers=auth_headers)

    # 4. Asserções de Resposta
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/x-zip-compressed"
    assert "attachment; filename=documentos_validos.zip" in response.headers["content-disposition"]

    # 5. Descompactar em memória e validar o conteúdo
    zip_buffer = io.BytesIO(response.content)
    with zipfile.ZipFile(zip_buffer, "r") as zip_ref:
        lista_arquivos = zip_ref.namelist()
        
        # Deve ter exatos 2 arquivos (o expirado ficou de fora)
        assert len(lista_arquivos) == 2
        
        # Valida se renomeou o duplicado para não sobrescrever
        assert "documento.pdf" in lista_arquivos
        assert "documento_1.pdf" in lista_arquivos

def test_export_valid_documents_zip_no_valid_docs(client, auth_headers, test_company, db_session):
    """Valida o erro 404 quando o cliente não possui documentos válidos para exportar."""
    from app.models.document_model import Document, DocumentStatus

    # Cria apenas um documento expirado e um arquivado
    doc1 = Document(
        title="Expirado", filename="vencido.pdf", file_path="/fake",
        company_id=test_company.id, status=DocumentStatus.EXPIRED.value
    )
    doc2 = Document(
        title="Arquivado", filename="arq.pdf", file_path="/fake",
        company_id=test_company.id, status="archived"
    )
    db_session.add_all([doc1, doc2])
    db_session.commit()

    response = client.get(f"/documents/export/zip?company_id={test_company.id}", headers=auth_headers)

    assert response.status_code == 404
    assert "Nenhum documento válido/vigente" in response.text

def test_export_valid_documents_zip_no_physical_files(client, auth_headers, test_company, db_session):
    """Valida erro 404 quando o banco aponta para arquivos físicos que não existem mais no disco."""
    from app.models.document_model import Document, DocumentStatus

    # Documento válido, mas com um caminho de disco inexistente
    doc = Document(
        title="Fantasma", filename="fantasma.pdf", file_path="/caminho/falso/que/nao/existe.pdf",
        company_id=test_company.id, status=DocumentStatus.VALID.value
    )
    db_session.add(doc)
    db_session.commit()

    response = client.get(f"/documents/export/zip?company_id={test_company.id}", headers=auth_headers)

    assert response.status_code == 404
    assert "ficheiros físicos não existem no servidor" in response.text