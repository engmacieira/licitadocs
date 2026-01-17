"""
Router de Autenticação.
Controla as rotas relacionadas a cadastro e login de usuários.
Data: Sprint 01
"""
from datetime import timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user_model import Company
from app.schemas.user_schemas import UserCreate, UserResponse, Token
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
        
        # Como é B2B, o usuário JÁ nasce com uma empresa vinculada.
        random_cnpj = str(uuid.uuid4())[:14]
        new_company = Company(
            cnpj=random_cnpj, # Placeholder (depois pedimos o real)
            razao_social=f"Empresa de {new_user.email}",
            owner_id=new_user.id
        )
        db.add(new_company)
        db.commit()
        # -------------------------------------------
        
        return new_user
    except ValueError as e:
        # Captura erros de validação do Repository (ex: falha na integridade)
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Rota de Login (Gera Token JWT).
    
    Recebe: username (email) e password via Form-Data (padrão OAuth2).
    Retorna: access_token e token_type.
    """
    # 1. Busca usuário pelo email (username no form do OAuth2 é o nosso email)
    user = UserRepository.get_by_email(db, email=form_data.username)
    
    # 2. Autenticação (Existe? Senha bate?)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Se ativo? (Regra de negócio opcional, mas recomendada)
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
        
    # 4. Gera o Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}