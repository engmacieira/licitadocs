"""
Repositório de Usuários.
Camada responsável por todas as operações diretas no banco de dados referentes a Usuários.
Segue o padrão Repository para isolar o domínio da tecnologia de persistência.
Data: Sprint 01
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user_model import User
from app.schemas.user_schemas import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate):
        """
        Cria um novo usuário no banco de dados.
        
        Fluxo:
        1. Recebe dados validados (Schema).
        2. Criptografa a senha.
        3. Persiste no banco.
        
        Args:
            db (Session): Sessão ativa do banco de dados.
            user_in (UserCreate): Dados do usuário.
            
        Returns:
            User: O objeto usuário criado.
        """
        # 1. Criptografia
        hashed_password = get_password_hash(user_in.password)
        
        # 2. Montagem do Objeto
        db_user = User(
            email=user_in.email,
            password_hash=hashed_password,
            is_active=user_in.is_active
        )
        
        # 3. Persistência com Tratamento de Erro
        try:
            db.add(db_user)
            db.commit()      # Efetiva a transação
            db.refresh(db_user) # Recarrega o objeto com o ID gerado e dados do banco
            return db_user
            
        except IntegrityError as e:
            # Rollback é obrigatório em caso de erro para não travar a sessão
            db.rollback() 
            # Em um cenário real, trataríamos melhor o erro (ex: email duplicado)
            # Para agora, vamos relançar ou retornar None
            print(f"Erro ao criar usuário: {e}") 
            raise ValueError("Email já cadastrado ou erro de integridade.")
            
        except Exception as e:
            db.rollback()
            print(f"Erro inesperado no repositório: {e}")
            raise e

    @staticmethod
    def get_by_email(db: Session, email: str):
        """Busca um usuário pelo email."""
        return db.query(User).filter(User.email == email).first()