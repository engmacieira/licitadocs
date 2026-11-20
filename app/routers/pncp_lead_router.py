"""
Router Administrativo de Leads PNCP.
Gerencia listagem, sincronização com o PNCP e registro de contatos com controle anti-SPAM.
"""

from typing import Literal, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_role
from app.models.user_model import User, UserRole
from app.repositories.pncp_lead_repository import PncpLeadRepository
from app.schemas.pncp_lead_schemas import (
    PncpLeadContactRequest,
    PncpLeadContactResponse,
    PncpLeadListResponse,
    PncpLeadResponse,
    PncpLeadSyncRequest,
    PncpLeadSyncResponse,
)
from app.services.pncp_service import PncpService

router = APIRouter(prefix="/admin/leads", tags=["Administração - Leads PNCP"])


@router.get(
    "",
    response_model=PncpLeadListResponse,
    summary="Listar Leads do PNCP",
    description="Lista leads capturados do PNCP com busca textual, filtro por UF e elegibilidade anti-SPAM.",
)
def list_pncp_leads(
    search: Optional[str] = None,
    uf: Optional[str] = None,
    contact_status: Optional[Literal["all", "ready", "cooldown", "never_contacted"]] = None,
    cooldown_days: int = Query(7, ge=1, le=365),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
):
    items, total, stats = PncpLeadRepository.list_filtered(
        db=db,
        search=search,
        uf=uf,
        contact_status=contact_status,
        default_cooldown_days=cooldown_days,
        skip=skip,
        limit=limit,
    )
    return PncpLeadListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        stats=stats,
    )


@router.post(
    "/sync",
    response_model=PncpLeadSyncResponse,
    summary="Sincronizar Leads do PNCP",
    description="Consulta contratações recentes na API pública do PNCP e realiza upsert seguro dos fornecedores.",
)
async def sync_pncp_leads(
    payload: PncpLeadSyncRequest = Body(default_factory=PncpLeadSyncRequest),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
):
    return await PncpService.sync_leads(
        db=db,
        uf=payload.uf,
        dias_retroativos=payload.dias_retroativos,
        codigo_modalidade=payload.codigo_modalidade,
        max_paginas=payload.max_paginas,
        tamanho_pagina=payload.tamanho_pagina,
    )


@router.post(
    "/{lead_id}/contact",
    response_model=PncpLeadContactResponse,
    summary="Registrar Contato com Lead",
    description="Registra um contato comercial com o lead e sinaliza caso esteja em janela de cooldown anti-SPAM.",
)
def register_pncp_lead_contact(
    lead_id: str,
    payload: PncpLeadContactRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
):
    try:
        lead, was_in_cooldown = PncpLeadRepository.register_contact(
            db=db,
            lead_id=lead_id,
            channel=payload.channel,
            notes=payload.notes,
            cooldown_days=payload.cooldown_days,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead PNCP não encontrado.",
        )

    warning_message: Optional[str] = None
    if was_in_cooldown:
        warning_message = (
            f"Atenção: este lead foi contatado dentro da janela anti-SPAM "
            f"({lead.spam_cooldown_days} dias)."
        )

    return PncpLeadContactResponse(
        lead=lead,
        was_in_cooldown=was_in_cooldown,
        warning_message=warning_message,
    )


@router.get(
    "/{lead_id}",
    response_model=PncpLeadResponse,
    summary="Detalhar Lead PNCP",
    description="Retorna os detalhes completos e status anti-SPAM de um lead específico.",
)
def get_pncp_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role([UserRole.ADMIN.value])),
):
    lead = PncpLeadRepository.get_by_id(db, lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead PNCP não encontrado.",
        )
    return lead
