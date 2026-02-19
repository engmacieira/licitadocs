"""
Testes da Sprint 17: Arquitetura de Dados & Cofre Inteligente.
Cobre Schemas, Repositórios e Rotas unificadas (Legado + Estruturado).
"""
import pytest
import io # <-- NOVO IMPORT
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Importamos os componentes que vamos testar
from app.main import app
from app.dependencies import get_current_active_user
from app.schemas.document_schemas import DocumentResponse, DocumentStatusEnum
from app.repositories.document_repository import DocumentRepository
from app.models.company_model import Company
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.models.user_model import User, UserRole

# =====================================================================
# MOCK DE AUTENTICAÇÃO
# =====================================================================
def override_get_admin_user():
    return User(
        id="fake-admin-uuid", 
        email="admin@test.com", 
        role=UserRole.ADMIN.value, 
        is_active=True, 
        company_links=[]
    )

app.dependency_overrides[get_current_active_user] = override_get_admin_user

# =====================================================================
# 1. TESTES DE UNIDADE: SCHEMAS
# =====================================================================

def test_schema_accepts_legacy_document():
    data = {
        "id": "leg-123",
        "title": "Contrato Social Antigo",
        "filename": "contrato_old.pdf",
        "expiration_date": date(2025, 12, 31),
        "status": "valid",
        "created_at": datetime.now(),
        "is_structured": False
    }
    
    doc = DocumentResponse(**data)
    assert doc.id == "leg-123"
    assert doc.is_structured is False
    assert doc.type_id is None 
    assert doc.category_name is None

def test_schema_accepts_structured_certificate():
    data = {
        "id": "cert-456",
        "title": "CND Federal",
        "filename": "cnd_nova.pdf",
        "status": "processing",
        "created_at": datetime.now(),
        "is_structured": True,
        "type_id": "type-999",
        "category_name": "Regularidade Fiscal",
        "authentication_code": "ABCD-1234"
    }
    
    doc = DocumentResponse(**data)
    assert doc.is_structured is True
    assert doc.authentication_code == "ABCD-1234"
    assert doc.status == DocumentStatusEnum.PROCESSING

# =====================================================================
# 2. TESTES DE INTEGRAÇÃO: REPOSITORY
# =====================================================================

def test_repository_get_unified_documents(db_session: Session):
    test_company = Company(cnpj="11111111111111", razao_social="Empresa Teste Merge")
    db_session.add(test_company)
    db_session.commit()
    
    cat = DocumentCategory(name="Teste Categoria", slug="teste_cat")
    db_session.add(cat)
    db_session.commit()
    
    doc_type = DocumentType(name="Teste Tipo", slug="teste_tipo", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    DocumentRepository.create_legacy(
        db=db_session, title="Legado", filename="legado.pdf", 
        file_path="/tmp/legado.pdf", company_id=test_company.id
    )
    
    DocumentRepository.create_certificate(
        db=db_session, type_id=doc_type.id, filename="novo.pdf", 
        file_path="/tmp/novo.pdf", company_id=test_company.id,
        authentication_code="CODE-99"
    )
    
    unified_list = DocumentRepository.get_unified_by_company(db_session, test_company.id)
    
    assert len(unified_list) == 2, "Deveria retornar 1 legado e 1 certificado"
    
    legado = next(item for item in unified_list if not item["is_structured"])
    certificado = next(item for item in unified_list if item["is_structured"])
    
    assert legado["title"] == "Legado"
    assert legado["type_id"] is None
    assert certificado["authentication_code"] == "CODE-99"
    assert certificado["category_name"] == "Teste Categoria" 

# =====================================================================
# 3. TESTES DE INTEGRAÇÃO: ROUTER
# =====================================================================

def test_api_get_document_types(client: TestClient):
    response = client.get("/documents/types")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_api_upload_routing_logic(client: TestClient, db_session: Session):
    test_company = Company(cnpj="22222222222222", razao_social="Empresa Upload")
    db_session.add(test_company)
    db_session.commit()

    cat = DocumentCategory(name="Cat Upload", slug="cat_up")
    db_session.add(cat)
    db_session.commit()
    doc_type = DocumentType(name="Tipo Upload", slug="tipo_up", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    # Cria PDFs falsos na memória para o teste não depender de arquivos reais no disco
    fake_pdf = io.BytesIO(b"%PDF-1.4 Fake PDF Content para teste estruturado")
    fake_pdf_old = io.BytesIO(b"%PDF-1.4 Fake PDF Content para teste legado")

    # A. Testa Upload Estruturado (Com type_id)
    response_novo = client.post(
        "/documents/upload",
        data={
            "target_company_id": test_company.id,
            "type_id": doc_type.id,
            "authentication_code": "TEST-AUTH"
        },
        files={"file": ("fake.pdf", fake_pdf, "application/pdf")}
    )
    
    assert response_novo.status_code == 201
    assert response_novo.json()["is_structured"] is True

    # B. Testa Upload Legado (Sem type_id, mas com title)
    response_legado = client.post(
        "/documents/upload",
        data={
            "target_company_id": test_company.id,
            "title": "Documento Antigão"
        },
        files={"file": ("fake_old.pdf", fake_pdf_old, "application/pdf")}
    )
    
    assert response_legado.status_code == 201
    assert response_legado.json()["is_structured"] is False
    assert response_legado.json()["title"] == "Documento Antigão"