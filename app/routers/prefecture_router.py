"""
Router de Prefeituras (Cofre Municipal).
Gere os dados de contacto e links de portais das prefeituras para emissão de CNDs.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.user_model import User, UserRole
from app.schemas.prefecture_schemas import PrefectureCreate, PrefectureUpdate, PrefectureResponse
from app.repositories.prefecture_repository import PrefectureRepository

# Prefixo e Tag para organizar o Swagger
router = APIRouter(prefix="/prefectures", tags=["Portal de Prefeituras"])

@router.get("/", response_model=List[PrefectureResponse])
def list_prefectures(
    skip: int = 0, 
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as prefeituras cadastradas.
    Permitido para qualquer utilizador autenticado (para o Frontend poder listar num select, se necessário).
    """
    return PrefectureRepository.get_all(db, skip=skip, limit=limit)

@router.post("/", response_model=PrefectureResponse, status_code=status.HTTP_201_CREATED)
def create_prefecture(
    pref_in: PrefectureCreate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Cadastra uma nova prefeitura.
    REQUER: Perfil de ADMIN.
    """
    return PrefectureRepository.create(db, pref_in)

@router.put("/{pref_id}", response_model=PrefectureResponse)
def update_prefecture(
    pref_id: str,
    pref_in: PrefectureUpdate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de contacto ou link de uma prefeitura.
    REQUER: Perfil de ADMIN.
    """
    return PrefectureRepository.update(db, pref_id, pref_in)

@router.delete("/{pref_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prefecture(
    pref_id: str,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Remove uma prefeitura do sistema.
    REQUER: Perfil de ADMIN.
    """
    PrefectureRepository.delete(db, pref_id)
    return None