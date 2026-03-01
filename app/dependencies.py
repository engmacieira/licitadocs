"""
Injeção de Dependências (Security & Database).
Centraliza a lógica de autenticação (JWT) e autorização (Roles).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user_model import UserRole, User, UserCompanyLink, UserCompanyRole
from app.repositories.user_repository import UserRepository

# Configura o esquema de segurança para o Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Decodifica o Token JWT e recupera o usuário logado."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais de autenticação inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = UserRepository.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Garante que o usuário está ativo no sistema."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user

# ==========================================
# 🛡️ NOVO NÚCLEO DE RBAC (Role-Based Access Control)
# ==========================================

def require_role(allowed_roles: List[str]):
    """
    Fábrica de Dependência. 
    Permite passar uma lista de cargos que podem acessar a rota.
    Ex: current_user = Depends(require_role([UserRole.ADMIN.value]))
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado: Requer privilégios de {', '.join(allowed_roles)}."
            )
        return current_user
    return role_checker

# Atalho legado mantido para retrocompatibilidade em outras partes do sistema (opcional)
def get_current_active_admin(current_user: User = Depends(require_role([UserRole.ADMIN.value]))) -> User:
    return current_user

# ==========================================

def verify_company_access(
    company_id: str, 
    user: User, 
    required_role: Optional[str] = None
) -> UserCompanyLink:
    """Verifica se o usuário tem acesso à empresa especificada."""
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