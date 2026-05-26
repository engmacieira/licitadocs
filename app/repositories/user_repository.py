"""
Repositório de Usuários.
Camada responsável por todas as operações diretas no banco de dados referentes a Usuários.
Herda de BaseRepository para garantir suporte a Soft Delete automaticamente.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Optional

from app.repositories.base_repository import BaseRepository
from app.models.user_model import User
from app.schemas.user_schemas import UserCreate
from app.core.security import get_password_hash

class UserRepository(BaseRepository[User]):
    # Define qual modelo esta classe manipula para o BaseRepository
    model = User

    @classmethod
    def create_user(cls, db: Session, user_in: UserCreate) -> User:
        """
        Cria um novo usuário (apenas a entidade User).
        """
        hashed_password = get_password_hash(user_in.password)
        
        db_user = cls.model(
            id=user_in.id, # IMPORTANTE: Usar o ID que veio do Supabase Auth
            email=user_in.email,
            password_hash=hashed_password,
            is_active=user_in.is_active,
            cpf=user_in.cpf,
            rg=user_in.rg,
            celular=user_in.celular,
            genero=user_in.genero
        )
        
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
            
        except IntegrityError:
            db.rollback()
            raise ValueError("Email ou CPF já cadastrado.")
            
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro de banco ao criar usuário: {str(e)}")

    @classmethod
    def get_by_email(cls, db: Session, email: str) -> Optional[User]:
        return cls.get_active_query(db).filter(cls.model.email == email).first()
        
    @classmethod
    def get_by_cpf(cls, db: Session, cpf: str) -> Optional[User]:
        return cls.get_active_query(db).filter(cls.model.cpf == cpf).first()

    @classmethod
    def get_by_id(cls, db: Session, user_id: str) -> Optional[User]:
        return super().get_by_id(db, user_id)
