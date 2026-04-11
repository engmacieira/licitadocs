import pytest
import uuid
from sqlalchemy.exc import IntegrityError
from app.models.company_model import Company
from app.models.user_model import User
from app.tests.conftest import generate_valid_cnpj

def test_create_company_happy_path(db_session):
    cnpj = generate_valid_cnpj()
    company = Company(
        cnpj=cnpj,
        razao_social="Empresa Teste LTDA",
        nome_fantasia="Teste Fantasia",
        inscricao_estadual="123456789",
        cep="01001-000",
        logradouro="Praça da Sé",
        bairro="Sé",
        cidade="São Paulo",
        estado="SP",
        email_corporativo="contato@teste.com"
    )
    db_session.add(company)
    db_session.commit()

    company_in_db = db_session.query(Company).filter_by(cnpj=cnpj).first()
    assert company_in_db is not None
    assert company_in_db.razao_social == "Empresa Teste LTDA"
    assert company_in_db.is_active is True
    assert company_in_db.id is not None

def test_company_duplicate_cnpj(db_session):
    cnpj = generate_valid_cnpj()
    c1 = Company(cnpj=cnpj, razao_social="Empresa 1")
    c2 = Company(cnpj=cnpj, razao_social="Empresa 2")
    
    db_session.add(c1)
    db_session.commit()
    
    db_session.add(c2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_company_null_razao_social(db_session):
    """
    Testa erro ao omitir Razão Social (campo obrigatório).
    """
    c = Company(cnpj="22222222000122")
    db_session.add(c)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_company_is_regular_logic(db_session):
    from app.models.user_model import User # Importamos o User
    import uuid
    
    # 1. Criamos um Dono com e-mail VERIFICADO
    uid = uuid.uuid4().hex[:6]
    owner = User(
        email=f"dono_{uid}@regularidade.com", 
        password_hash="123",
        is_email_verified=True # <-- A regra de negócio exige isso agora!
    )
    db_session.add(owner)
    db_session.commit()

    # 2. Criamos a empresa e atrelamos ao Dono
    cnpj = generate_valid_cnpj()
    company = Company(
        cnpj=cnpj, 
        razao_social="Empresa Regularidade",
        owner_id=owner.id # <-- Vínculo criado!
    )
    db_session.add(company)
    db_session.commit()

    # Inicialmente não regular
    assert company.is_regular is False

    # Somente contrato assinado não é suficiente
    company.is_contract_signed = True
    assert company.is_regular is False

    # Somente contrato + pagamento não é suficiente
    company.is_payment_active = True
    assert company.is_regular is False

    # Todos os requisitos da empresa + e-mail do dono preenchidos
    company.is_admin_verified = True
    assert company.is_regular is True # Agora vai passar brilhantemente!

def test_company_owner_relationship(db_session):
    uid = uuid.uuid4().hex[:6]
    email = f"owner_{uid}@example.com"
    cnpj = generate_valid_cnpj()
    owner = User(email=email, password_hash="123")
    db_session.add(owner)
    db_session.commit()

    company = Company(
        cnpj=cnpj, 
        razao_social="Empresa do Dono",
        owner_id=owner.id
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    db_session.refresh(owner)

    assert company.owner is not None
    assert company.owner.id == owner.id
    assert len(owner.owned_companies) == 1
    assert owner.owned_companies[0].id == company.id
