"""
Injeção de Dependências Globais.
Centraliza a lógica de autenticação e recuperação do usuário atual.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user_model import UserRole, User
from app.repositories.user_repository import UserRepository

# Define de onde o token vem (Url de login para o Swagger saber)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decodifica o Token JWT e recupera o usuário logado.
    Usado como dependência nas rotas protegidas.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decodifica o token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # 2. Busca o usuário no banco
    user = UserRepository.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_admin(current_user: User = Depends(get_current_user)):
    """
    Dependência que só deixa passar se o usuário for ADMIN.
    """
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilégios de Administrador necessários"
        )
    return current_user