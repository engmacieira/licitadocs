"""
Testes da Sprint 18: Gestão do Catálogo (Settings / Admin).
Cobre o CRUD de Categorias e Tipos de Documentos, com foco nas regras de Integridade Relacional.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Importamos os componentes que vamos testar
from app.main import app
from app.dependencies import get_current_active_user
from app.models.user_model import User, UserRole
from app.models.company_model import Company
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.models.certificate_model import Certificate
from app.repositories.document_repository import DocumentRepository
from app.schemas.document_schemas import (
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate
)

# =====================================================================
# MOCK DE AUTENTICAÇÃO (ADMIN)
# =====================================================================
def override_get_admin_user():
    return User(
        id="fake-admin-settings", 
        email="admin_settings@test.com", 
        role=UserRole.ADMIN.value, 
        is_active=True, 
        company_links=[]
    )

app.dependency_overrides[get_current_active_user] = override_get_admin_user

# =====================================================================
# 1. TESTES DE INTEGRAÇÃO: REPOSITORY (Regras de Negócio)
# =====================================================================

def test_repo_crud_category(db_session: Session):
    """Testa o ciclo de vida completo (Caminho Feliz) de uma Categoria."""
    # 1. Create
    cat_in = DocumentCategoryCreate(name="Nova Cat", slug="nova_cat", order=1)
    cat = DocumentRepository.create_category(db_session, cat_in)
    assert cat.id is not None
    assert cat.name == "Nova Cat"

    # 2. Update
    cat_update = DocumentCategoryUpdate(name="Cat Atualizada")
    cat_updated = DocumentRepository.update_category(db_session, cat.id, cat_update)
    assert cat_updated.name == "Cat Atualizada"
    assert cat_updated.slug == "nova_cat" # Slug não deve ter mudado

    # 3. Delete
    DocumentRepository.delete_category(db_session, cat.id)
    deleted_cat = db_session.query(DocumentCategory).filter_by(id=cat.id).first()
    assert deleted_cat is None

def test_repo_prevent_category_deletion(db_session: Session):
    """Garante que a API IMPEDE a exclusão de uma Categoria se ela tiver Tipos."""
    # Cria Categoria
    cat = DocumentCategory(name="Cat Protegida", slug="cat_prot")
    db_session.add(cat)
    db_session.commit()

    # Cria Tipo atrelado à Categoria
    doc_type = DocumentType(name="Tipo Teste", slug="tipo_teste", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    # Tenta Deletar a Categoria
    with pytest.raises(ValueError, match="Tipos de Documentos vinculados"):
        DocumentRepository.delete_category(db_session, cat.id)

def test_repo_prevent_type_deletion(db_session: Session):
    """Garante que a API IMPEDE a exclusão de um Tipo se clientes já tiverem feito upload dele."""
    # Setup Básico
    cat = DocumentCategory(name="Cat Base", slug="cat_base")
    db_session.add(cat)
    company = Company(cnpj="99999999999999", razao_social="Empresa Blindada")
    db_session.add(company)
    db_session.commit()

    doc_type = DocumentType(name="Tipo Protegido", slug="tipo_prot", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    # Simula um cliente fazendo upload deste tipo de certidão
    cert = Certificate(
        type_id=doc_type.id, company_id=company.id, 
        file_path="/tmp/fake.pdf", filename="fake.pdf"
    )
    db_session.add(cert)
    db_session.commit()

    # Tenta Deletar o Tipo de Documento
    with pytest.raises(ValueError, match="certidões de clientes vinculadas"):
        DocumentRepository.delete_type(db_session, doc_type.id)


# =====================================================================
# 2. TESTES DE INTEGRAÇÃO: ROUTER (API Endpoints)
# =====================================================================

def test_api_crud_document_types(client: TestClient, db_session: Session):
    """Testa as rotas de criação, edição e exclusão de um Tipo de Documento."""
    
    # Precisamos de uma categoria base primeiro
    cat = DocumentCategory(name="API Cat", slug="api_cat")
    db_session.add(cat)
    db_session.commit()

    # 1. POST /documents/types (Create)
    payload_create = {
        "name": "Certidão Nova API",
        "slug": "cert_nova_api",
        "validity_days_default": 30,
        "description": "Instruções aqui",
        "category_id": cat.id
    }
    response_post = client.post("/documents/types", json=payload_create)
    assert response_post.status_code == 201
    
    type_id = response_post.json()["id"]

    # 2. PUT /documents/types/{id} (Update)
    payload_update = {
        "name": "Certidão Editada API"
    }
    response_put = client.put(f"/documents/types/{type_id}", json=payload_update)
    assert response_put.status_code == 200
    assert response_put.json()["name"] == "Certidão Editada API"

    # 3. DELETE /documents/types/{id} (Delete)
    response_del = client.delete(f"/documents/types/{type_id}")
    assert response_del.status_code == 204
    
    # Confirma exclusão na base
    deleted = db_session.query(DocumentType).filter_by(id=type_id).first()
    assert deleted is None