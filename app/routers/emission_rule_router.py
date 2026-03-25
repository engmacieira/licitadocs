"""
Router de Regras de Emissão (Diretórios).
Gere os links e os contactos para emissão de documentos por abrangência (Nacional, Estadual, Municipal).
Inclui também a gestão da fila de trabalho (Solicitações de Emissão).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User, UserRole
from app.repositories.emission_rule_repository import EmissionRuleRepository
from app.repositories.emission_request_repository import EmissionRequestRepository
from app.schemas.emission_rule_schemas import EmissionRuleCreate, EmissionRuleUpdate, EmissionRuleResponse
from app.schemas.emission_request_schemas import (
    EmissionRequestCreate, 
    EmissionRequestUpdate, 
    EmissionRequestResponse,
    EmissionRequestStatus
)
from app.dependencies import get_current_active_user, require_role, verify_company_access

# Prefixo atualizado para refletir a nova arquitetura
router = APIRouter(prefix="/emission-rules", tags=["Diretórios de Emissão e Fila"])

# ==========================================
# 📖 GESTÃO DE REGRAS (DIRETÓRIOS)
# ==========================================

@router.get(
    "/", 
    response_model=List[EmissionRuleResponse],
    summary="Listar Regras de Emissão"
)
def list_emission_rules(
    skip: int = 0, 
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as regras de emissão (Diretórios).
    Permitido para qualquer utilizador autenticado (para o Frontend poder listar na hora da emissão manual).
    """
    return EmissionRuleRepository.get_all(db, skip=skip, limit=limit)

@router.post(
    "/", 
    response_model=EmissionRuleResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar Regra de Emissão"
)
def create_emission_rule(
    rule_in: EmissionRuleCreate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Cadastra uma nova regra de emissão (link ou contacto para uma localidade e documento).
    REQUER: Perfil de Administrador.
    """
    try:
        return EmissionRuleRepository.create(db, rule_in)
    except (ValueError, IntegrityError) as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/resolve", 
    response_model=Optional[EmissionRuleResponse],
    summary="Resolução Mágica de Regra"
)
def resolve_emission_link(
    document_type_id: str = Query(..., description="ID do Tipo de Documento"),
    company_id: str = Query(..., description="ID da Empresa alvo"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint Dinâmico: Resolve o link de emissão exato cruzando o Tipo de Documento 
    com o endereço cadastrado da Empresa (Nacional, Estadual ou Municipal).
    Retorna 'null' se não houver regra aplicável.
    """
    return EmissionRuleRepository.resolve_rule_for_company(db, document_type_id, company_id)

@router.get(
    "/{rule_id}", 
    response_model=EmissionRuleResponse,
    summary="Detalhes da Regra de Emissão"
)
def get_emission_rule_by_id(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Busca uma regra de emissão específica pelo seu ID.
    Usado pela Central de Emissão Manual no Frontend para abrir os detalhes.
    """
    # Substituído db.query() direto pelo Repositório blindado
    rule = EmissionRuleRepository.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regra de emissão não encontrada.")
    return rule

@router.put(
    "/{rule_id}", 
    response_model=EmissionRuleResponse,
    summary="Atualizar Regra de Emissão"
)
def update_emission_rule(
    rule_id: str,
    rule_in: EmissionRuleUpdate,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de contacto ou link de uma regra de emissão existente.
    REQUER: Perfil de Administrador.
    """
    try:
        return EmissionRuleRepository.update(db, rule_id, rule_in)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(
    "/{rule_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Regra de Emissão"
)
def delete_emission_rule(
    rule_id: str,
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Remove uma regra de emissão do sistema (Aplica Soft Delete via Repositório).
    REQUER: Perfil de Administrador.
    """
    # O Repositório encarrega-se do Soft Delete e lança 404 se não existir
    try:
        EmissionRuleRepository.delete(db, rule_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None

# ==========================================
# 🛠️ HISTÓRICO E FILA DE EMISSÃO MANUAL
# ==========================================

@router.get(
    "/{rule_id}/requests",
    response_model=List[EmissionRequestResponse],
    summary="Listar Histórico de Solicitações"
)
def list_emission_requests(
    rule_id: str, 
    company_id: str = Query(..., description="ID da empresa alvo"), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna o histórico formatado de pedidos pendentes/concluídos para a Central de Emissão Manual."""
    # Blindagem IDOR
    verify_company_access(company_id, current_user, db)
    return EmissionRequestRepository.get_by_rule_and_company(db, rule_id, company_id)

@router.post(
    "/{rule_id}/requests",
    response_model=EmissionRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registar Solicitação de Emissão"
)
def create_emission_request(
    rule_id: str, 
    payload: EmissionRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Regista um novo disparo de pedido (e.g. email enviado) no histórico da fila de trabalho."""
    # Blindagem IDOR
    verify_company_access(payload.company_id, current_user, db)
    return EmissionRequestRepository.create(db, rule_id, current_user.id, payload)

@router.patch(
    "/requests/{request_id}",
    response_model=EmissionRequestResponse,
    summary="Atualizar Solicitação (Previsão/Status)"
)
def update_emission_request(
    request_id: str, 
    payload: EmissionRequestUpdate, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value]))
):
    """Atualiza a previsão de entrega ou marca a solicitação como concluída/erro (Admin Only)."""
    try:
        return EmissionRequestRepository.update(db, request_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))