import pytest
import uuid
from sqlalchemy.exc import IntegrityError
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.tests.conftest import generate_valid_cnpj, generate_valid_cpf

def test_create_user_happy_path(db_session):
    uid = uuid.uuid4().hex[:6]
    email = f"test_{uid}@example.com"
    cpf = generate_valid_cpf()
    new_user = User(
        email=email,
        password_hash="hashed_password",
        nome="João Silva",
        cpf=cpf,
        role=UserRole.CLIENT.value
    )
    db_session.add(new_user)
    db_session.commit()

    # Verificar persistência
    user_in_db = db_session.query(User).filter_by(email=email).first()
    assert user_in_db is not None
    assert user_in_db.email == email
    assert user_in_db.nome == "João Silva"
    assert user_in_db.id is not None  # Gerado pelo default=generate_uuid
    assert user_in_db.is_active is True
    assert user_in_db.role == UserRole.CLIENT.value

def test_create_user_minimal(db_session):
    uid = uuid.uuid4().hex[:6]
    email = f"minimal_{uid}@example.com"
    user = User(
        email=email,
        password_hash="secret"
    )
    db_session.add(user)
    db_session.commit()

    user_in_db = db_session.query(User).filter_by(email=email).first()
    assert user_in_db.nome is None
    assert user_in_db.role == UserRole.CLIENT.value  # Default value

def test_user_duplicate_email(db_session):
    uid = uuid.uuid4().hex[:6]
    email = f"dup_{uid}@example.com"
    user1 = User(email=email, password_hash="123")
    user2 = User(email=email, password_hash="456")
    
    db_session.add(user1)
    db_session.commit()
    
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_user_null_email_error(db_session):
    """
    Testa erro ao omitir e-mail (campo obrigatório).
    """
    user = User(password_hash="123")
    db_session.add(user)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_user_company_link(db_session):
    uid = uuid.uuid4().hex[:6]
    email = f"member_{uid}@example.com"
    cnpj = generate_valid_cnpj()
    # Criar usuário
    user = User(email=email, password_hash="123")
    # Criar empresa
    company = Company(cnpj=cnpj, razao_social="Empresa Teste")
    
    db_session.add(user)
    db_session.add(company)
    db_session.commit()

    # Criar vínculo
    link = UserCompanyLink(
        user_id=user.id,
        company_id=company.id,
        role=UserCompanyRole.MASTER.value
    )
    db_session.add(link)
    db_session.commit()

    # Verificar relacionamentos
    assert len(user.company_links) == 1
    assert user.company_links[0].company_id == company.id
    assert user.company_links[0].role == UserCompanyRole.MASTER.value
    assert len(company.members) == 1
    assert company.members[0].user_id == user.id
