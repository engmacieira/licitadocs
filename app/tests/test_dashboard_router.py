import pytest
from fastapi import status
from datetime import datetime, timedelta
from app.models.user_model import UserRole, User
from app.models.company_model import Company
from app.models.document_model import Document
from app.models.certificate_model import Certificate
from app.models.document_type_model import DocumentType
from app.models.document_category_model import DocumentCategory
from app.core.security import create_access_token

def test_admin_stats_schema_and_unification(client, db_session):
    """
    Missão 3: Valida se o Admin Stats retorna o formato correto e 
    unifica corretamente Documentos e Certificados recentes.
    """
    # 1. Setup Admin
    admin_email = "admin_tdd@example.com"
    admin = User(email=admin_email, password_hash="hash", role=UserRole.ADMIN.value, is_active=True)
    db_session.add(admin)
    
    # 2. Setup Empresa
    company = Company(razao_social="Empresa Teste TDD", cnpj="12345678901234")
    db_session.add(company)
    db_session.flush()
    
    # 3. Inserir um Documento Legado
    doc = Document(
        title="Contrato Social",
        filename="contrato.pdf",
        file_path="/tmp/contrato.pdf",
        company_id=company.id
        # Remova qualquer created_at manual daqui!
    )
    db_session.add(doc)
    db_session.commit() # Salva no banco
    
    import time
    time.sleep(1) # <--- A MÁGICA DO QA: Pausamos 1 segundo para garantir que o banco vire o relógio!
    
    # 4. Inserir um Certificado (Garantidamente mais novo)
    cat = DocumentCategory(name="Fiscal", slug="fiscal_test")
    db_session.add(cat)
    db_session.flush()
    
    dtype = DocumentType(name="CND Federal", slug="cnd-federal-test", category_id=cat.id)
    db_session.add(dtype)
    db_session.flush()
    
    cert = Certificate(
        type_id=dtype.id,
        filename="cnd.pdf",
        file_path="/tmp/cnd.pdf",
        company_id=company.id
        # Remova qualquer created_at manual daqui também!
    )
    db_session.add(cert)
    db_session.commit()
    
    # 5. Request
    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/dashboard/admin/stats", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    
    # Valida Estrutura (Missão 1)
    assert "total_companies" in data
    assert "total_documents" in data
    assert "recent_documents" in data
    assert "recent_companies" in data
    
    # Valida Unificação (Missão 2)
    recent_docs = data["recent_documents"]
    assert len(recent_docs) >= 2
    
    # O primeiro deve ser o Certificado (pois é mais recente)
    assert recent_docs[0]["title"] == "CND Federal"
    assert recent_docs[0]["is_structured"] is True
    
    # O segundo deve ser o Documento
    assert recent_docs[1]["title"] == "Contrato Social"
    assert recent_docs[1]["is_structured"] is False

def test_client_stats_schema(client, auth_headers, test_company, db_session):
    """Valida o formato do Client Stats."""
    response = client.get(f"/dashboard/client/stats?company_id={test_company.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "company_name" in data
    assert "total_docs" in data
    assert "docs_valid" in data
    assert "recent_docs" in data
    assert isinstance(data["recent_docs"], list)

def test_client_stats_forbidden(client, auth_headers):
    """Valida que o cliente não acessa estatísticas de outra empresa."""
    import uuid
    fake_cid = str(uuid.uuid4())
    response = client.get(f"/dashboard/client/stats?company_id={fake_cid}", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
