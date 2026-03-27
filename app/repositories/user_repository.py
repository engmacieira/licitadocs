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
        O vínculo com empresa deve ser feito posteriormente via UserCompanyLink.
        """
        # Hash da senha feito de forma segura
        hashed_password = get_password_hash(user_in.password)
        
        # Usamos cls.model para instanciar a entidade
        db_user = cls.model(
            email=user_in.email,
            password_hash=hashed_password,
            is_active=user_in.is_active,
            role=getattr(user_in, "role", "client"),
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
        """
        Busca usuário por e-mail (usado no Login/JWT).
        Blindado com get_active_query para barrar acessos de usuários deletados.
        """
        return cls.get_active_query(db).filter(cls.model.email == email).first()
        
    @classmethod
    def get_by_cpf(cls, db: Session, cpf: str) -> Optional[User]:
        """Busca usuário por CPF (Único)."""
        return cls.get_active_query(db).filter(cls.model.cpf == cpf).first()

    @classmethod
    def get_by_id(cls, db: Session, user_id: str) -> Optional[User]:
        """Busca usuário por ID (mantido explícito para clareza)."""
        # Chama a inteligência do BaseRepository que já filtra os deletados
        return super().get_by_id(db, user_id)