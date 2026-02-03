"""
Repositório de Usuários.
Camada responsável por todas as operações diretas no banco de dados referentes a Usuários.

"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Optional

from app.models.user_model import User
from app.schemas.user_schemas import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        """
        Cria um novo usuário com senha hash.
        Lança ValueError se e-mail duplicado.
        """
        hashed_password = get_password_hash(user_in.password)
        
        db_user = User(
            email=user_in.email,
            password_hash=hashed_password,
            is_active=user_in.is_active,    
            company_id=user_in.company_id
        )
        
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
            
        except IntegrityError:
            db.rollback()
            raise ValueError("Email já cadastrado.")
            
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError(f"Erro de banco ao criar usuário: {str(e)}")

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Busca um usuário pelo email."""
        return db.query(User).filter(User.email == email).first()
        
    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        """Busca um usuário pelo ID."""
        return db.query(User).filter(User.id == user_id).first()