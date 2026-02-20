"""
Testes Unitários: Repositório de Documentos.
Testa a persistência real no banco de dados (sem mocks),
garantindo que o catálogo, os documentos legados e os certificados
são criados, unidos (unified) e apagados corretamente.
"""
import pytest
from datetime import date
from sqlalchemy.exc import IntegrityError

from app.repositories.document_repository import DocumentRepository
from app.models.company_model import Company
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.schemas.document_schemas import (
    DocumentCategoryCreate, DocumentCategoryUpdate,
    DocumentTypeCreate, DocumentTypeUpdate
)

# ==========================================
# 🗂️ 1. TESTES DO CATÁLOGO (Categorias e Tipos)
# ==========================================

def test_crud_category(db_session):
    """Testa Criar, Atualizar e Deletar uma Categoria Real no banco."""
    # 1. Create
    cat_in = DocumentCategoryCreate(name="Financeiro", slug="fin", order=1)
    cat = DocumentRepository.create_category(db_session, cat_in)
    assert cat.id is not None
    assert cat.slug == "fin"

    # 2. Update
    cat_up = DocumentCategoryUpdate(name="Financeiro 2024")
    updated = DocumentRepository.update_category(db_session, str(cat.id), cat_up)
    assert updated.name == "Financeiro 2024"

    # 3. Erro de Update (ID falso)
    with pytest.raises(ValueError, match="Categoria não encontrada"):
        DocumentRepository.update_category(db_session, "id-falso", cat_up)

    # 4. Delete
    DocumentRepository.delete_category(db_session, str(cat.id))
    
    # Valida Delete
    with pytest.raises(ValueError):
        DocumentRepository.delete_category(db_session, str(cat.id))

def test_category_integrity_error(db_session):
    """Testa se o banco impede dois slugs iguais."""
    cat_in = DocumentCategoryCreate(name="RH", slug="rh", order=1)
    DocumentRepository.create_category(db_session, cat_in)
    
    # Tenta criar com o mesmo SLUG
    with pytest.raises(ValueError, match="Já existe uma categoria com este slug"):
        DocumentRepository.create_category(db_session, cat_in)

def test_delete_category_with_types_fails(db_session):
    """Regra de Negócio: Não pode apagar categoria que tem tipos dentro."""
    cat = DocumentRepository.create_category(db_session, DocumentCategoryCreate(name="TI", slug="ti", order=2))
    type_in = DocumentTypeCreate(name="Políticas", slug="politicas", category_id=str(cat.id), is_expirable=False)
    DocumentRepository.create_type(db_session, type_in)
    
    with pytest.raises(ValueError, match="ainda possui Tipos de Documentos vinculados"):
        DocumentRepository.delete_category(db_session, str(cat.id))

def test_crud_document_type(db_session):
    """Testa o fluxo completo de Tipos de Documento."""
    cat = DocumentRepository.create_category(db_session, DocumentCategoryCreate(name="Fiscal", slug="fisc", order=3))
    
    # Create
    type_in = DocumentTypeCreate(name="Alvará", slug="alvara", category_id=str(cat.id), is_expirable=True, validity_days_default=365)
    doc_type = DocumentRepository.create_type(db_session, type_in)
    assert doc_type.id is not None
    assert doc_type.name == "Alvará"

    # Update
    type_up = DocumentTypeUpdate(name="Alvará Atualizado")
    updated = DocumentRepository.update_type(db_session, str(doc_type.id), type_up)
    assert updated.name == "Alvará Atualizado"

    # List (Traz categorias com eager loading dos tipos)
    catalog = DocumentRepository.get_all_categories_with_types(db_session)
    assert len(catalog) > 0
    assert catalog[-1].types[0].name == "Alvará Atualizado"

    # Delete
    DocumentRepository.delete_type(db_session, str(doc_type.id))
    with pytest.raises(ValueError):
         DocumentRepository.delete_type(db_session, str(doc_type.id))


# ==========================================
# 📄 2. TESTES DE DOCUMENTOS E CERTIFICADOS
# ==========================================

def test_create_and_get_unified_documents(db_session):
    """
    Testa a criação de um documento legado, um certificado novo e
    a grande query `get_unified_by_company` que une os dois mundos!
    """
    # 1. Setup Básico (Empresa e Catálogo)
    company = Company(cnpj="99988877000166", razao_social="Cofre SA")
    db_session.add(company)
    db_session.commit()
    
    cat = DocumentRepository.create_category(db_session, DocumentCategoryCreate(name="Legal", slug="leg", order=4))
    doc_type = DocumentRepository.create_type(db_session, DocumentTypeCreate(name="CNPJ", slug="cnpj-card", category_id=str(cat.id), is_expirable=False))

    # 2. Cria Documento Legado
    doc_legado = DocumentRepository.create_legacy(
        db=db_session, title="Contrato Velho", filename="velho.pdf", 
        file_path="/tmp/velho.pdf", company_id=str(company.id)
    )

    # 3. Cria Certificado Estruturado (Sprint 17)
    cert = DocumentRepository.create_certificate(
        db=db_session, type_id=str(doc_type.id), filename="novo.pdf", 
        file_path="/tmp/novo.pdf", company_id=str(company.id), 
        expiration_date=date(2025, 12, 31)
    )

    # 4. A Grande União (Unified Fetch)
    unified = DocumentRepository.get_unified_by_company(db_session, str(company.id))
    
    assert len(unified) == 2
    
    # 🏆 QA SÉNIOR: Separa os documentos pelas suas características para não depender do relógio!
    doc_estruturado = next(d for d in unified if d["is_structured"] is True)
    doc_classico = next(d for d in unified if d["is_structured"] is False)

    # Verifica o Certificado
    assert doc_estruturado["title"] == "CNPJ" # Herdou o nome do Tipo!
    assert doc_estruturado["category_name"] == "Legal"
    assert doc_estruturado["expiration_date"] == date(2025, 12, 31)

    # Verifica o Legado
    assert doc_classico["title"] == "Contrato Velho"
    assert doc_classico["category_name"] is None
    
def test_delete_type_with_certificates_fails(db_session):
    """Regra de Negócio: Não pode apagar Tipo que já possui certificados no cofre."""
    company = Company(cnpj="11122233000199", razao_social="Cliente")
    db_session.add(company)
    db_session.commit()

    cat = DocumentRepository.create_category(db_session, DocumentCategoryCreate(name="Geral", slug="geral", order=5))
    doc_type = DocumentRepository.create_type(db_session, DocumentTypeCreate(name="Balanço", slug="balanco", category_id=str(cat.id), is_expirable=False))
    
    DocumentRepository.create_certificate(
        db=db_session, type_id=str(doc_type.id), filename="balanco.pdf", 
        file_path="/tmp/balanco.pdf", company_id=str(company.id)
    )

    with pytest.raises(ValueError, match="Já existem certidões de clientes vinculadas a ele"):
        DocumentRepository.delete_type(db_session, str(doc_type.id))

def test_get_file_path(db_session):
    """Testa se consegue encontrar os caminhos físicos dos arquivos (Legados e Novos)."""
    company = Company(cnpj="55566677000188", razao_social="Path SA")
    db_session.add(company)
    db_session.commit()

    # Cria Legado
    doc_legado = DocumentRepository.create_legacy(
        db=db_session, title="Path Legado", filename="legado.pdf", 
        file_path="/tmp/path_legado.pdf", company_id=str(company.id)
    )
    
    # Cria Certificado (sem Tipo para simplificar, já que a FK não é enforced no teste puramente)
    cat = DocumentRepository.create_category(db_session, DocumentCategoryCreate(name="Z", slug="z", order=9))
    doc_type = DocumentRepository.create_type(db_session, DocumentTypeCreate(name="Z", slug="z", category_id=str(cat.id), is_expirable=False))
    
    cert = DocumentRepository.create_certificate(
        db=db_session, type_id=str(doc_type.id), filename="cert.pdf", 
        file_path="/tmp/path_cert.pdf", company_id=str(company.id)
    )

    assert DocumentRepository.get_file_path(db_session, str(doc_legado.id)) == "/tmp/path_legado.pdf"
    assert DocumentRepository.get_file_path(db_session, str(cert.id)) == "/tmp/path_cert.pdf"
    assert DocumentRepository.get_file_path(db_session, "id_inexistente") is None