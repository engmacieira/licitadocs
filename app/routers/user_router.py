from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.user_schemas import UserResponse 

router = APIRouter(prefix="/users", tags=["Gestão de Usuários"])

@router.get(
    "/me", 
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter dados do usuário logado",
    description="""
    Retorna os detalhes do perfil do usuário autenticado (identificado pelo Token JWT).
    
    Esta rota é utilizada pelo Frontend para:
    - Verificar se o Token ainda é válido.
    - Obter o ID e o Papel (Role) para controle de acesso.
    - Carregar dados básicos (Email, Empresa).
    """
)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna o objeto User completo (filtrado pelo Schema de Response).
    """
    return current_user