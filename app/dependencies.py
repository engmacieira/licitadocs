"""
Injeção de Dependências (Security & Database).
Centraliza a lógica de autenticação (JWT) e autorização (Roles).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user_model import UserRole, User, UserCompanyLink, UserCompanyRole
from app.repositories.user_repository import UserRepository

# Configura o esquema de segurança para o Swagger UI
# tokenUrl: Indica para o Swagger onde ele deve enviar o form de login (username/password)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Decodifica o Token JWT e recupera o usuário logado.
    Usada como dependência obrigatória em rotas protegidas.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais de autenticação inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Tenta decodificar o token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
    except JWTError:
        # Token expirado ou assinatura inválida
        raise credentials_exception
        
    # 2. Verifica se o usuário ainda existe no banco
    # (Segurança extra: se o user foi deletado, o token antigo para de funcionar)
    user = UserRepository.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica se o usuário está ativo.
    Útil para rotas onde o usuário precisa estar logado e ativo (mas não necessariamente Admin).
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user

def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependência de Autorização: Apenas ADMINs podem passar.
    """
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Requer privilégios de Administrador."
        )
    return current_user

def verify_company_access(
    company_id: str, 
    user: User, 
    required_role: Optional[str] = None
) -> UserCompanyLink:
    """
    Verifica se o usuário tem acesso à empresa especificada.
    Se required_role for passado (ex: MASTER), verifica se ele tem esse cargo.
    """
    # Procura o vínculo na lista de links do usuário (carregada na memória)
    # Isso evita uma query extra no banco se o user já estiver carregado
    link = next((l for l in user.company_links if l.company_id == company_id), None)

    if not link or not link.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Você não tem acesso a esta empresa."
        )

    if required_role and link.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Permissão insuficiente. Requer acesso {required_role}."
        )
    
    return link