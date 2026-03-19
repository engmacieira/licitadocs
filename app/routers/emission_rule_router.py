"""
Router de Regras de Emissão (Diretórios).
Gere os links e os contactos para emissão de documentos por abrangência (Nacional, Estadual, Municipal).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.user_model import User, UserRole
from app.models.emission_rule_model import EmissionRule
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate, EmissionRuleResponse
from app.repositories.emission_rule_repository import EmissionRuleRepository
from app.schemas.emission_request_schemas import EmissionRequestCreate, EmissionRequestUpdate
from app.repositories.emission_request_repository import EmissionRequestRepository

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

@router.get("/resolve", response_model=Optional[EmissionRuleResponse])
def resolve_emission_link(
    document_type_id: str = Query(..., description="ID do Tipo de Documento"),
    company_id: str = Query(..., description="ID da Empresa"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint Dinâmico: Resolve o link de emissão exato cruzando o Documento com o endereço da Empresa.
    Uso: /emission-rules/resolve?document_type_id=XXX&company_id=YYY
    """
    return EmissionRuleRepository.resolve_rule_for_company(db, document_type_id, company_id)

@router.get("/{rule_id}", response_model=EmissionRuleResponse)
def get_emission_rule_by_id(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Busca uma regra de emissão específica pelo seu ID.
    Usado pela Central de Emissão Manual no Frontend.
    """
    rule = db.query(EmissionRule).filter(EmissionRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Regra de emissão não encontrada.")
        
    return rule

# --- HISTÓRICO DE EMISSÃO MANUAL ---

@router.get("/{rule_id}/requests")
def list_emission_requests(
    rule_id: str, 
    company_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna o histórico formatado para a Central de Emissão Manual."""
    return EmissionRequestRepository.get_by_rule_and_company(db, rule_id, company_id)

@router.post("/{rule_id}/requests")
def create_emission_request(
    rule_id: str, 
    payload: EmissionRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Regista um novo disparo de e-mail no histórico."""
    return EmissionRequestRepository.create(db, rule_id, current_user.id, payload)

@router.patch("/requests/{request_id}")
def update_emission_request(
    request_id: str, 
    payload: EmissionRequestUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualiza a previsão de retorno ou marca como concluído."""
    EmissionRequestRepository.update(db, request_id, payload)
    return {"message": "Histórico atualizado com sucesso"}