"""
Router de Autenticação.
Controla as rotas relacionadas a cadastro e login de usuários.
Data: Sprint 01
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user_schemas import UserCreate, UserResponse
from app.repositories.user_repository import UserRepository

# Prefix: todas as rotas aqui começarão com /auth
# Tags: para agrupar na documentação automática (Swagger)
router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário no sistema.
    
    - Verifica se o e-mail já existe.
    - Cria o usuário com senha criptografada.
    - Retorna os dados do usuário (sem a senha).
    """
    # 1. Regra de Negócio: Email Único
    # Antes de tentar criar, perguntamos ao Repository se já existe.
    existing_user = UserRepository.get_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado."
        )
    
    # 2. Criação
    try:
        new_user = UserRepository.create_user(db=db, user_in=user)
        return new_user
    except ValueError as e:
        # Captura erros de validação do Repository (ex: falha na integridade)
        raise HTTPException(status_code=400, detail=str(e))