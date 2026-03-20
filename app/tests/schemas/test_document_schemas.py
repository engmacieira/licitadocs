import pytest
from app.schemas.document_schemas import (
    DocumentTypeCreate, DocumentCategoryCreate, DocumentResponse, 
    DocumentStatusEnum, DocumentScopeEnum
)
from app.models.document_type_model import DocumentType
from app.models.document_category_model import DocumentCategory
from sqlalchemy.orm import Session

# --- Caminho Feliz ---

def test_document_category_create(schema_tester):
    """Valida a criação de categoria organizacional."""
    data = {"name": "Fiscal", "slug": "fiscal", "order": 1}
    category_in = DocumentCategoryCreate(**data)
    assert category_in.name == "Fiscal"
    assert category_in.slug == "fiscal"

def test_document_type_with_automation(schema_tester):
    """Valida tipo de documento com configuração de automação (Módulo 3)."""
    data = {
        "name": "Certidão Federal",
        "slug": "cnd_federal",
        "category_id": "some-uuid",
        "scope": DocumentScopeEnum.NATIONAL,
        "automation_config": {
            "is_automatable": True,
            "strategy_name": "RFB_Crawler"
        }
    }
    doc_type_in = DocumentTypeCreate(**data)
    assert doc_type_in.automation_config.is_automatable is True
    assert doc_type_in.automation_config.strategy_name == "RFB_Crawler"

def test_document_persistence(db_session: Session, schema_tester):
    """Verifica persistência de categorias e tipos no banco."""
    # 1. Categoria
    cat_in = DocumentCategoryCreate(name="Jurídica", slug="juridica")
    cat_model = schema_tester.persist_and_verify(db_session, DocumentCategory, cat_in)
    
    # 2. Tipo (vinculado à categoria)
    type_in = DocumentTypeCreate(
        name="Contrato Social", 
        slug="contrato_social", 
        category_id=cat_model.id
    )
    type_model = schema_tester.persist_and_verify(db_session, DocumentType, type_in)
    
    assert cat_model.id is not None
    assert type_model.category_id == cat_model.id

# --- Casos de Borda ---

def test_document_status_enum_validation():
    """Valida que o status do documento deve pertencer ao Enum."""
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        # 'invalid_status' não está no DocumentStatusEnum
        DocumentResponse(
            id="1", filename="test.pdf", status="invalid", created_at="2023-01-01T00:00:00"
        )

# --- Tratamento de Erros ---

def test_document_type_missing_required(schema_tester):
    """Verifica erro ao omitir campos obrigatórios."""
    schema_tester.assert_validation_error(
        DocumentTypeCreate, 
        {"name": "Missing Slug", "category_id": "123"}, # falta slug
        "slug"
    )
