import pytest
from datetime import datetime, timezone
from app.repositories.base_repository import BaseRepository
from app.models.user_model import User
from app.core.database import SoftDeleteMixin, Base, SessionLocal
from sqlalchemy import Column, String, Integer

# Mock model for Testing Dynamic PK
class MockPKModel(Base, SoftDeleteMixin):
    __tablename__ = "mock_pk_model"
    custom_id = Column(Integer, primary_key=True)
    name = Column(String)

class MockPKRepository(BaseRepository[MockPKModel]):
    model = MockPKModel

def test_soft_delete_no_commit(db_session):
    """
    Missão 1: Comprovar que o soft_delete não efetiva os dados sem commit externo.
    """
    # Create the table for the mock model
    MockPKModel.__table__.create(db_session.get_bind(), checkfirst=True)
    
    # Adicionar um registro e commitar
    obj = MockPKModel(custom_id=1, name="Teste Transaction")
    db_session.add(obj)
    db_session.commit()
    
    # Executar soft_delete (que faz flush() mas não commit())
    result = MockPKRepository.soft_delete(db_session, 1)
    assert result is not None
    assert result.deleted_at is not None
    
    # Abrir uma NOVA sessão para verificar se o dado foi commitado no banco
    new_db = SessionLocal()
    try:
        # Busca direta via Query para evitar filtros do repositório
        db_obj = new_db.query(MockPKModel).filter(MockPKModel.custom_id == 1).first()
        assert db_obj is not None
        # O dado no banco ainda deve estar com deleted_at NULL porque o commit não foi chamado
        assert db_obj.deleted_at is None
    finally:
        new_db.close()

def test_soft_delete_timezone_aware(db_session, test_user):
    """
    Missão 2 e 4: Comprovar que o deleted_at possui informação de timezone.
    """
    from app.repositories.user_repository import UserRepository
    
    # O test_user já existe (fixture)
    user_id = test_user.id
    
    # Executar soft_delete
    UserRepository.soft_delete(db_session, user_id)
    
    # Buscar o objeto novamente (ignora soft delete para checar o campo via query direta)
    user = db_session.query(User).filter(User.id == user_id).first()
    
    assert user.deleted_at is not None
    # Verifica se é um datetime aware (possui tzinfo)
    assert user.deleted_at.tzinfo is not None
    # Verifica se o timezone é UTC (conforme refatoração)
    # Dependendo do driver do banco, pode vir como um objeto tzinfo do Python ou similar
    assert user.deleted_at.tzinfo == timezone.utc or "+00:00" in str(user.deleted_at.tzinfo)

def test_get_by_id_dynamic_pk(db_session):
    """
    Missão 3: Comprovar que o get_by_id funciona com PK que não se chama 'id'.
    """
    MockPKModel.__table__.create(db_session.get_bind(), checkfirst=True)
    obj = MockPKModel(custom_id=99, name="Dynamic PK Test")
    db_session.add(obj)
    db_session.commit()
    
    # O repositório deve encontrar o registro usando a coluna 'custom_id' dinamicamente
    found = MockPKRepository.get_by_id(db_session, 99)
    assert found is not None
    assert found.custom_id == 99
    assert found.name == "Dynamic PK Test"
