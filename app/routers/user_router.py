from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.user_schemas import UserResponse 

# Prefixo '/users' significa que as rotas aqui começam com isso
router = APIRouter(prefix="/users", tags=["Usuários"])

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário logado atualmente via Token JWT.
    Usado pelo frontend para saber a Role (Admin/Client).
    """
    return current_user