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
from app.core.config import settings
from app.models.user_model import UserRole, User, UserCompanyLink
from app.repositories.user_repository import UserRepository

# Configuração do esquema OAuth2 para integração automática com o Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

from app.core.context import user_id_var

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Decodifica o Token JWT do Supabase e recupera o usuário do banco de dados.
    Garante que o portador do token é um usuário válido e armazena o id em contextvars.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais de autenticação inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 🛡️ Validação com o Segredo do JWT do Supabase
        # O payload do Supabase contém 'sub' que é o UUID do usuário.
        # Se SUPABASE_JWT_SECRET estiver definido, usamos ele; caso contrário, fallback para SECRET_KEY antigo (para transição).
        jwt_key = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY

        payload = jwt.decode(token, jwt_key, algorithms=[settings.ALGORITHM], audience="authenticated")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        # Se falhar, tentamos validar sem audience (fallback para tokens antigos ou customizados)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str = payload.get("sub") # No antigo usávamos email como sub
            user = UserRepository.get_by_email(db, email=email)
            if user:
                user_id = str(user.id)
            else:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
    # Busca o usuário utilizando o UUID do Supabase
    user = UserRepository.get_by_id(db, user_id=user_id)
    if user is None:
        # Caso o usuário exista no Auth mas não no nosso public.users, podemos estar em transição
        raise credentials_exception
        
    # Armazena o ID do usuário no contextvar para a auditoria de negócios (Audit Trail)
    user_id_var.set(str(user.id))

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

def require_role(allowed_roles: List[any]):
    """
    Fábrica de dependência para restrição de acesso por cargo (ADMIN/CLIENT).
    Uso: current_user = Depends(require_role([UserRole.ADMIN.value]))
    """
    allowed_roles_str = [str(role) for role in allowed_roles]
    
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = str(current_user.role.value) if hasattr(current_user.role, 'value') else str(current_user.role)
        
        if user_role not in allowed_roles_str:
            detail = f"Acesso negado: Requer privilégios de {', '.join(allowed_roles_str)}."
            if "client" in allowed_roles_str and len(allowed_roles_str) == 1:
                detail = "O Chatbot IA é um recurso exclusivo para clientes."

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail
            )
        return current_user
        
    return role_checker

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
    
    if user.role == UserRole.ADMIN.value:
        return None  
    
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

    if required_role and link.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Permissão insuficiente nesta empresa. Requer nível: {required_role}."
        )
    
    return link
