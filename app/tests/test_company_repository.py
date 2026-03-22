import pytest
from sqlalchemy.orm import Session
from app.repositories.company_repository import CompanyRepository
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate
from app.models.company_model import Company
from app.tests.conftest import generate_valid_cnpj

def test_company_happy_path(db_session: Session):
    """Valida a criação e leitura de uma empresa."""
    cnpj = generate_valid_cnpj()
    company_in = CompanyCreate(
        razao_social="Licitadocs Corp",
        cnpj=cnpj
    )
    company = CompanyRepository.create(db_session, company_in)
    
    assert company.id is not None
    assert company.razao_social == "Licitadocs Corp"
    assert company.cnpj == cnpj
    
    # Busca por ID
    db_company = CompanyRepository.get_by_id(db_session, company.id)
    assert db_company.id == company.id
    
    # Busca por CNPJ
    db_company_cnpj = CompanyRepository.get_by_cnpj(db_session, cnpj)
    assert db_company_cnpj.id == company.id

def test_company_update(db_session: Session, test_company: Company):
    """Valida a atualização de dados da empresa."""
    update_data = CompanyUpdate(name="Updated Razão Social")
    updated_company = CompanyRepository.update(db_session, test_company.id, update_data)
    
    assert updated_company.razao_social == "Updated Razão Social"
    assert updated_company.cnpj == test_company.cnpj

def test_company_soft_delete(db_session: Session, test_company: Company):
    """Valida o protocolo de Soft Delete para empresas."""
    company_id = test_company.id
    
    # Executa soft delete
    success = CompanyRepository.delete(db_session, company_id)
    assert success is True
    
    # Verifica se o campo deleted_at foi preenchido
    deleted_company = db_session.query(Company).filter(Company.id == company_id).first()
    assert deleted_company.deleted_at is not None
    
    # Verifica se os métodos de busca filtram a empresa deletada por padrão
    assert CompanyRepository.get_by_id(db_session, company_id) is None
    assert CompanyRepository.get_by_cnpj(db_session, test_company.cnpj) is None
    
    all_companies = CompanyRepository.get_all(db_session)
    assert not any(c.id == company_id for c in all_companies)

def test_company_unique_cnpj(db_session: Session, test_company: Company):
    """Testa violação de CNPJ único."""
    company_duplicate = CompanyCreate(
        name="Another Company",
        cnpj=test_company.cnpj
    )
    with pytest.raises(ValueError, match="Erro ao criar empresa"):
        CompanyRepository.create(db_session, company_duplicate)

def test_company_relationships(db_session: Session, test_company: Company, test_user):
    """Valida o relacionamento entre empresa e proprietário."""
    # O test_company já é vinculado ao test_user na fixture de conftest
    assert test_company.owner_id == test_user.id
    assert test_company.owner.id == test_user.id
    assert test_company in test_user.owned_companies
