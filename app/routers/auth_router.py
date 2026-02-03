"""
Router de Autenticação.
Controla as rotas relacionadas a cadastro e login de usuários.
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

# Tags: Agrupa as rotas no Swagger UI
router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post(
    "/register", 
    response_model=UserResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo usuário (Sign Up)",
    description="""
    Cria uma nova conta de usuário no sistema.
    
    **Fluxo de Onboarding Automático:**
    Como o sistema é Multi-Tenant (B2B), ao criar um usuário, o sistema também:
    1. Cria uma **Empresa** provisória vinculada a este usuário.
    2. Define o usuário como **Owner** (Dono) dessa empresa.
    """
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Validação de Email Único
    existing_user = UserRepository.get_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado."
        )
    
    # 2. Criação Transacional (User + Company)
    try:
        new_user = UserRepository.create_user(db=db, user_in=user)
        
        # Placeholder da Empresa (Regra de Negócio: Todo user precisa de uma company)
        random_cnpj = str(uuid.uuid4())[:14]
        new_company = Company(
            cnpj=random_cnpj, 
            razao_social=f"Empresa de {new_user.email}",
            owner_id=new_user.id
        )
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        
        # Vincula de volta
        new_user.company_id = new_company.id
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post(
    "/login", 
    response_model=Token,
    summary="Login (Obter Token)",
    description="""
    Autentica o usuário e retorna um **Access Token (JWT)**.
    
    - **Formato:** OAuth2 Password Flow (Form-Data).
    - **Username:** Use o **e-mail** do usuário.
    - **Validade:** O token expira conforme configuração (padrão 30min).
    """
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Busca usuário
    user = UserRepository.get_by_email(db, email=form_data.username)
    
    # 2. Verifica Credenciais
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Verifica Status
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
        
    # 4. Emite Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}