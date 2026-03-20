import pytest
import uuid
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.document_model import Document, DocumentStatus
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.models.certificate_model import Certificate, CertificateStatus
from app.models.company_model import Company
from app.models.user_model import User

@pytest.fixture
def sample_setup(db_session):
    uid = uuid.uuid4().hex[:6]
    company = Company(cnpj=f"11223344{uid}", razao_social="Empresa Base")
    user = User(email=f"doc_user_{uid}@example.com", password_hash="123")
    db_session.add(company)
    db_session.add(user)
    db_session.commit()
    return company, user

def test_document_category_and_type_creation(db_session):
    uid = uuid.uuid4().hex[:6]
    cat = DocumentCategory(name=f"Jurídico_{uid}", slug=f"juridico_{uid}")
    db_session.add(cat)
    db_session.commit()
    
    doc_type = DocumentType(
        name=f"Contrato Social_{uid}", 
        slug=f"contrato_social_{uid}",
        description="Contrato de constituição",
        category_id=cat.id
    )
    db_session.add(doc_type)
    db_session.commit()
    
    assert doc_type.category.name == f"Jurídico_{uid}"
    assert len(cat.types) == 1

def test_create_document_happy_path(db_session, sample_setup):
    """
    Testa a criação de um documento vinculado a uma empresa e usuário.
    """
    company, user = sample_setup
    doc = Document(
        title="Contrato 2024",
        filename="contrato.pdf",
        file_path="storage/docs/contrato.pdf",
        company_id=company.id,
        uploaded_by_id=user.id,
        status=DocumentStatus.VALID.value
    )
    db_session.add(doc)
    db_session.commit()
    
    assert doc.id is not None
    assert doc.company.id == company.id
    assert doc.uploader.id == user.id

def test_document_missing_company_error(db_session):
    """
    Testa erro ao tentar criar documento sem empresa (campo obrigatório).
    """
    doc = Document(filename="erro.pdf", file_path="path/erro.pdf")
    db_session.add(doc)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_certificate_creation_and_link(db_session, sample_setup):
    company, user = sample_setup
    uid = uuid.uuid4().hex[:6]
    
    # Criar Tipo de Documento
    cat = DocumentCategory(name=f"Fiscal_{uid}", slug=f"fiscal_{uid}")
    db_session.add(cat)
    db_session.commit()
    
    doc_type = DocumentType(name=f"CND Federal_{uid}", slug=f"cnd_federal_{uid}", category_id=cat.id)
    db_session.add(doc_type)
    db_session.commit()

    # Criar Documento (Arquivo)
    doc = Document(
        filename="cnd.pdf", 
        file_path="storage/cnd.pdf", 
        company_id=company.id
    )
    db_session.add(doc)
    db_session.commit()

    # Criar Certificado (Inteligência)
    cert = Certificate(
        company_id=company.id,
        type_id=doc_type.id,
        document_id=doc.id,
        file_path="storage/cnd.pdf",
        filename="cnd.pdf",
        authentication_code="ABC-123",
        expiration_date=date(2025, 12, 31),
        status=CertificateStatus.VALID.value
    )
    db_session.add(cert)
    db_session.commit()

    assert cert.document.id == doc.id
    assert doc.certificate_info.id == cert.id
    assert cert.document_type.name == f"CND Federal_{uid}"
    assert cert.company.id == company.id
