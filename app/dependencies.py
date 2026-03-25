"""
Injeção de Dependências (Segurança, Autenticação e Autorização).
Centraliza a lógica de validação de Tokens JWT e controle de acesso baseado em cargos (RBAC).
Implementa a lógica de Multi-tenancy para isolamento de dados entre empresas.
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user_model import UserRole, User, UserCompanyLink
from app.repositories.user_repository import UserRepository

# Configuração do esquema OAuth2 para integração automática com o Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Decodifica o Token JWT e recupera o usuário do banco de dados.
    Garante que o portador do token é um usuário válido.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais de autenticação inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificação e validação do payload JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Busca o usuário utilizando o repositório (que deve respeitar o Soft Delete)
    user = UserRepository.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifica se o usuário autenticado está com a conta ativa."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuário inativo no sistema."
        )
    return current_user

# --- Sistema de Controle de Acesso (RBAC) ---

def require_role(allowed_roles: List[str]):
    """
    Fábrica de dependência para restrição de acesso por cargo (ADMIN/CLIENT).
    Uso: current_user = Depends(require_role([UserRole.ADMIN.value]))
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado: Requer privilégios de {', '.join(allowed_roles)}."
            )
        return current_user
    return role_checker

# Atalho para rotas exclusivas da equipe interna (Staff)
def get_current_active_admin(
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
) -> User:
    return current_user

# --- Validação de Tenant (Multi-tenancy) ---

def verify_company_access(
    company_id: str, 
    user: User, 
    db: Session = Depends(get_db),
    required_role: Optional[str] = None
) -> Optional[UserCompanyLink]:
    """
    Valida se o usuário tem permissão para acessar ou manipular dados de uma empresa.
    Implementa a 'Chave Mestra' para Administradores do LicitaDoc.
    Garante o respeito ao Soft Delete e status do vínculo.
    """
    
    # 🗝️ ADMINISTRADORES: Passe livre para suporte e auditoria
    if user.role == UserRole.ADMIN.value:
        return None  
    
    # CLIENTES: Verificação rigorosa no Banco de Dados (Blindagem contra Soft Delete)
    link = db.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == user.id,
        UserCompanyLink.company_id == company_id,
        UserCompanyLink.is_active == True,
        UserCompanyLink.deleted_at == None
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso negado: Você não possui vínculo ativo com esta empresa."
        )

    # Verificação opcional de permissão interna (MASTER/VIEWER)
    if required_role and link.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Permissão insuficiente nesta empresa. Requer nível: {required_role}."
        )
    
    return link