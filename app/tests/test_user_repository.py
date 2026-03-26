import os
import pytest
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.user_schemas import UserCreate
from app.models.user_model import User
from app.tests.conftest import generate_valid_cpf

def test_create_user_happy_path(db_session: Session):
    """Valida a criação de um usuário com sucesso."""
    import os
    email = f"user_repo_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="securepassword",
        is_active=True,
        cpf=generate_valid_cpf()
    )
    user = UserRepository.create_user(db_session, user_in)
    
    assert user.id is not None
    assert user.email == email
    assert user.is_active is True
    # Verifica persistência
    db_user = UserRepository.get_by_id(db_session, user.id)
    assert db_user.email == email

def test_user_soft_delete(db_session: Session, test_user: User):
    """Valida o protocolo de Soft Delete para usuários."""
    user_id = test_user.id
    
    # Executa soft delete
    deleted_user_result = UserRepository.soft_delete(db_session, user_id)
    assert deleted_user_result is not None  # Se o objeto voltou, o soft delete foi executado!
    
    # Verifica se o campo deleted_at foi preenchido
    # Precisamos de uma query bruta para ver o registro deletado
    deleted_user = db_session.query(User).filter(User.id == user_id).first()
    assert deleted_user.deleted_at is not None
    
    # Verifica se os métodos de busca filtram o usuário deletado por padrão
    assert UserRepository.get_by_id(db_session, user_id) is None
    assert UserRepository.get_by_email(db_session, test_user.email) is None
    
    all_users = UserRepository.get_all(db_session)
    assert not any(u.id == user_id for u in all_users)

def test_user_unique_constraints(db_session: Session, test_user: User):
    """Testa violações de integridade (Unique keys)."""
    # Mesmo email
    user_duplicate_email = UserCreate(
        email=test_user.email,
        password="password123",
        cpf=generate_valid_cpf()
    )
    with pytest.raises(ValueError, match="Email ou CPF já cadastrado"):
        UserRepository.create_user(db_session, user_duplicate_email)
        
    # Mesmo CPF
    user_duplicate_cpf = UserCreate(
        email=f"another_{os.urandom(4).hex()}@example.com",
        password="password123",
        cpf=test_user.cpf
    )
    with pytest.raises(ValueError, match="Email ou CPF já cadastrado"):
        UserRepository.create_user(db_session, user_duplicate_cpf)

def test_user_relationships(db_session: Session, test_user: User, test_company):
    """Valida o relacionamento entre usuário e empresas."""
    # O vínculo já é criado pela fixture test_company no conftest.py
    db_session.refresh(test_user)
    
    assert len(test_user.company_links) == 1
    assert test_user.company_links[0].company_id == test_company.id
    assert test_user.company_links[0].role == "MASTER"
