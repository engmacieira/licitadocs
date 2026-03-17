"""
Router de Regras de Emissão (Diretórios).
Gere os links e os contactos para emissão de documentos por abrangência (Nacional, Estadual, Municipal).
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.user_model import User, UserRole
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate, EmissionRuleResponse
from app.repositories.emission_rule_repository import EmissionRuleRepository

# Prefixo atualizado para refletir a nova arquitetura
router = APIRouter(prefix="/emission-rules", tags=["Diretórios de Emissão"])

@router.get("/", response_model=List[EmissionRuleResponse])
def list_emission_rules(
    skip: int = 0, 
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as regras de emissão (Diretórios).
    Permitido para qualquer utilizador autenticado (para o Frontend poder listar na hora da emissão).
    """
    return EmissionRuleRepository.get_all(db, skip=skip, limit=limit)

@router.post("/", response_model=EmissionRuleResponse, status_code=status.HTTP_201_CREATED)
def create_emission_rule(
    rule_in: EmissionRuleCreate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Cadastra uma nova regra de emissão (link ou contacto para uma localidade e documento).
    REQUER: Perfil de ADMIN.
    """
    return EmissionRuleRepository.create(db, rule_in)

@router.put("/{rule_id}", response_model=EmissionRuleResponse)
def update_emission_rule(
    rule_id: str,
    rule_in: EmissionRuleUpdate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de contacto ou link de uma regra de emissão existente.
    REQUER: Perfil de ADMIN.
    """
    return EmissionRuleRepository.update(db, rule_id, rule_in)

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emission_rule(
    rule_id: str,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Remove uma regra de emissão do sistema.
    REQUER: Perfil de ADMIN.
    """
    EmissionRuleRepository.delete(db, rule_id)
    return None