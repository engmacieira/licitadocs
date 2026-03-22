import pytest
from sqlalchemy.orm import Session
from app.repositories.document_repository import DocumentRepository
from app.models.document_model import Document
from app.models.certificate_model import Certificate
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from datetime import date, datetime

def test_document_legacy_happy_path(db_session: Session, test_company):
    """Valida a criação de um documento legado."""
    doc = DocumentRepository.create_legacy(
        db=db_session,
        title="Contrato Social",
        filename="contrato.pdf",
        file_path="/storage/contrato.pdf",
        company_id=test_company.id,
        expiration_date=None
    )
    
    assert doc.id is not None
    assert doc.title == "Contrato Social"
    assert doc.company_id == test_company.id

def test_certificate_happy_path(db_session: Session, test_company, test_doc_type):
    """Valida a criação de um certificado estruturado."""
    cert = DocumentRepository.create_certificate(
        db=db_session,
        type_id=test_doc_type.id,
        filename="cnd.pdf",
        file_path="/storage/cnd.pdf",
        company_id=test_company.id,
        expiration_date=date(2025, 12, 31),
        authentication_code="ABC-123"
    )
    
    assert cert.id is not None
    assert cert.type_id == test_doc_type.id
    assert cert.authentication_code == "ABC-123"

def test_document_unified_list_soft_delete(db_session: Session, test_company, test_doc_type):
    """Valida a listagem unificada e o filtro de Soft Delete."""
    # Cria um legado e um certificado
    doc = DocumentRepository.create_legacy(
        db_session, "Legado", "l.pdf", "/p1", test_company.id
    )
    cert = DocumentRepository.create_certificate(
        db_session, test_doc_type.id, "c.pdf", "/p2", test_company.id
    )
    
    # Verifica se aparecem na lista unificada
    unified = DocumentRepository.get_unified_by_company(db_session, test_company.id)
    assert len(unified) == 2
    
    # Soft delete no legado
    doc.deleted_at = datetime.now()
    db_session.commit()
    
    # Verifica se sumiu da lista
    unified_after = DocumentRepository.get_unified_by_company(db_session, test_company.id)
    assert len(unified_after) == 1
    assert unified_after[0]["id"] == cert.id

def test_category_and_type_soft_delete(db_session: Session, test_category: DocumentCategory, test_doc_type: DocumentType):
    """Valida o Soft Delete para categorias e tipos."""
    # Tentar excluir categoria com tipo ativo deve falhar (segundo a lógica do repositório)
    with pytest.raises(ValueError, match="Não é possível excluir uma categoria que ainda possui Tipos"):
        DocumentRepository.delete_category(db_session, test_category.id)
        
    # Excluir tipo
    DocumentRepository.delete_type(db_session, test_doc_type.id)
    
    # Verifica soft delete do tipo
    db_type = db_session.query(DocumentType).filter(DocumentType.id == test_doc_type.id).first()
    assert db_type.deleted_at is not None
    
    # Agora excluir categoria deve funcionar
    DocumentRepository.delete_category(db_session, test_category.id)
    db_cat = db_session.query(DocumentCategory).filter(DocumentCategory.id == test_category.id).first()
    assert db_cat.deleted_at is not None

def test_category_unique_slug(db_session: Session, test_category: DocumentCategory):
    """Testa violação de slug único em categorias."""
    from app.schemas.document_schemas import DocumentCategoryCreate
    cat_duplicate = DocumentCategoryCreate(
        name="Outra",
        slug=test_category.slug
    )
    with pytest.raises(ValueError, match="Já existe uma categoria com este slug"):
        DocumentRepository.create_category(db_session, cat_duplicate)

def test_get_all_categories_with_types(db_session: Session, test_doc_type):
    """Valida a listagem de catálogo."""
    catalog = DocumentRepository.get_all_categories_with_types(db_session)
    assert len(catalog) >= 1
    assert any(cat.id == test_doc_type.category_id for cat in catalog)

def test_get_file_path(db_session: Session, test_company, test_doc_type):
    """Valida a busca de caminhos de arquivos."""
    doc = DocumentRepository.create_legacy(db_session, "T", "f.pdf", "/path/doc", test_company.id)
    cert = DocumentRepository.create_certificate(db_session, test_doc_type.id, "c.pdf", "/path/cert", test_company.id)
    
    assert DocumentRepository.get_file_path(db_session, doc.id) == "/path/doc"
    assert DocumentRepository.get_file_path(db_session, cert.id) == "/path/cert"
    assert DocumentRepository.get_file_path(db_session, "invalid_id") is None

def test_category_crud_extended(db_session: Session, test_category):
    """Testa o ciclo de vida completo de uma categoria."""
    from app.schemas.document_schemas import DocumentCategoryUpdate
    
    # Update
    updated = DocumentRepository.update_category(db_session, test_category.id, DocumentCategoryUpdate(name="Novo Nome"))
    assert updated.name == "Novo Nome"
    
    # Update Not Found
    with pytest.raises(ValueError, match="Categoria não encontrada"):
        DocumentRepository.update_category(db_session, "invalid_id", DocumentCategoryUpdate(name="X"))
        
    # Delete Not Found
    with pytest.raises(ValueError, match="Categoria não encontrada"):
        DocumentRepository.delete_category(db_session, "invalid_id")

def test_type_crud_extended(db_session: Session, test_category, test_doc_type, test_company):
    """Testa o ciclo de vida completo de um tipo de documento."""
    from app.schemas.document_schemas import DocumentTypeCreate, DocumentTypeUpdate
    from app.models.document_type_model import DocumentScope
    
    # Create
    new_type_in = DocumentTypeCreate(
        name="Novo Tipo", slug="novo-slug", category_id=test_category.id, scope=DocumentScope.NATIONAL
    )
    new_type = DocumentRepository.create_type(db_session, new_type_in)
    assert new_type.id is not None
    
    # Update
    updated = DocumentRepository.update_type(db_session, new_type.id, DocumentTypeUpdate(name="Nome Editado"))
    assert updated.name == "Nome Editado"
    
    # Update Not Found
    with pytest.raises(ValueError, match="Tipo de documento não encontrado"):
        DocumentRepository.update_type(db_session, "invalid_id", DocumentTypeUpdate(name="X"))
        
    # Delete Not Found
    with pytest.raises(ValueError, match="Tipo de documento não encontrado"):
        DocumentRepository.delete_type(db_session, "invalid_id")
        
    # Delete blocked by certificates
    cert = DocumentRepository.create_certificate(db_session, test_doc_type.id, "c.pdf", "/p", test_company.id)
    with pytest.raises(ValueError, match="Não é possível excluir este Tipo. Já existem certidões"):
        DocumentRepository.delete_type(db_session, test_doc_type.id)

def test_update_metadata_unified(db_session: Session, test_company, test_doc_type):
    """Valida a atualização unificada de metadados."""
    doc = DocumentRepository.create_legacy(db_session, "L", "l.pdf", "/p1", test_company.id)
    cert = DocumentRepository.create_certificate(db_session, test_doc_type.id, "c.pdf", "/p2", test_company.id)
    
    # Update Legacy
    res_doc = DocumentRepository.update_metadata(db_session, doc.id, status="irregular")
    assert res_doc["type"] == "legacy"
    assert db_session.get(Document, doc.id).status == "irregular"
    
    # Update Certificate
    res_cert = DocumentRepository.update_metadata(db_session, cert.id, authentication_code="XYZ")
    assert res_cert["type"] == "certificate"
    assert db_session.get(Certificate, cert.id).authentication_code == "XYZ"
    
    # Update Not Found
    assert DocumentRepository.update_metadata(db_session, "invalid_id") is None

def test_global_monitoring(db_session: Session, test_company, test_doc_type):
    """Valida os métodos de monitoramento global (Admin)."""
    # Cria expirações e irregularidades
    future_date = date(2020, 1, 1) # No passado para forçar vencimento
    doc = DocumentRepository.create_legacy(db_session, "L", "l.pdf", "/p1", test_company.id, expiration_date=future_date)
    cert = DocumentRepository.create_certificate(db_session, test_doc_type.id, "c.pdf", "/p2", test_company.id)
    DocumentRepository.update_metadata(db_session, cert.id, status="error")
    
    # Expiring Global
    expiring = DocumentRepository.get_expiring_global(db_session, days_threshold=30)
    assert any(e["id"] == doc.id for e in expiring)
    
    # Irregular Global
    irregular = DocumentRepository.get_irregular_global(db_session)
    assert any(i["id"] == cert.id for i in irregular)

def test_unified_list_client_upload_filter(db_session: Session, test_company):
    """Valida o filtro de quem enviou na lista unificada."""
    DocumentRepository.create_legacy(db_session, "C1", "c.pdf", "/p1", test_company.id, is_client_upload=True)
    DocumentRepository.create_legacy(db_session, "A1", "a.pdf", "/p2", test_company.id, is_client_upload=False)
    
    res_client = DocumentRepository.get_unified_by_company(db_session, test_company.id, is_client_upload=True)
    assert len(res_client) == 1
    assert res_client[0]["title"] == "C1"
    
    res_admin = DocumentRepository.get_unified_by_company(db_session, test_company.id, is_client_upload=False)
    # 1 legumes + o que já existir (dependendo do estado global, mas aqui o test_company é novo)
    # Na verdade certificates também são admin
    assert any(r["title"] == "A1" for r in res_admin)
