"""
Schemas Pydantic v2 para Leads do PNCP e controle anti-SPAM.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

from app.utils.validators import validar_matematica_cnpj


def compute_cooldown_status(
    last_contacted_at: Optional[datetime],
    spam_cooldown_days: int,
    now: Optional[datetime] = None,
) -> tuple[bool, int]:
    """Calcula se um lead está em janela de cooldown anti-SPAM e quantos dias restam."""
    if not last_contacted_at or spam_cooldown_days <= 0:
        return False, 0

    reference_now = now or datetime.now(timezone.utc)
    contacted_utc = (
        last_contacted_at.replace(tzinfo=timezone.utc)
        if last_contacted_at.tzinfo is None
        else last_contacted_at.astimezone(timezone.utc)
    )
    cooldown_until = contacted_utc + timedelta(days=spam_cooldown_days)
    if reference_now >= cooldown_until:
        return False, 0

    remaining_seconds = (cooldown_until - reference_now).total_seconds()
    remaining_days = max(1, math.ceil(remaining_seconds / 86400))
    return True, remaining_days


class PncpLeadUpsert(BaseModel):
    """Payload normalizado para criação/atualização de Lead capturado do PNCP."""
    cnpj: str = Field(..., max_length=18)
    razao_social: str = Field(..., min_length=1)
    nome_fantasia: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    uf: Optional[str] = Field(None, max_length=2)
    municipio: Optional[str] = None
    porte: Optional[str] = None
    origem_pncp: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("cnpj", mode="before")
    @classmethod
    def validate_and_normalize_cnpj(cls, v: str) -> str:
        if not v:
            raise ValueError("CNPJ é obrigatório")
        return validar_matematica_cnpj(str(v))

    @field_validator("uf", mode="before")
    @classmethod
    def normalize_uf(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = str(v).strip().upper()
        return cleaned[:2] if cleaned else None

    @field_validator("razao_social", mode="before")
    @classmethod
    def normalize_razao_social(cls, v: str) -> str:
        cleaned = str(v or "").strip()
        if not cleaned:
            raise ValueError("Razão Social é obrigatória")
        return cleaned


class PncpLeadResponse(BaseModel):
    """Representação completa do Lead PNCP com status anti-SPAM calculado."""
    id: str
    cnpj: str
    razao_social: str
    nome_fantasia: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    uf: Optional[str] = None
    municipio: Optional[str] = None
    porte: Optional[str] = None
    origem_pncp: Optional[str] = None

    last_contacted_at: Optional[datetime] = None
    contact_count: int = 0
    last_contact_channel: Optional[str] = None
    last_contact_notes: Optional[str] = None
    spam_cooldown_days: int = 7

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    is_in_cooldown: bool = False
    cooldown_remaining_days: int = 0

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_cooldown_fields(self) -> "PncpLeadResponse":
        in_cooldown, remaining_days = compute_cooldown_status(
            self.last_contacted_at,
            self.spam_cooldown_days,
        )
        self.is_in_cooldown = in_cooldown
        self.cooldown_remaining_days = remaining_days
        return self


class PncpLeadContactRequest(BaseModel):
    """Requisição para registrar um contato comercial com o lead."""
    channel: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = None
    cooldown_days: Optional[int] = Field(None, ge=0, le=365)


class PncpLeadContactResponse(BaseModel):
    """Resposta do registro de contato com aviso caso estivesse em cooldown."""
    lead: PncpLeadResponse
    was_in_cooldown: bool
    warning_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PncpLeadStats(BaseModel):
    """Contadores agregados de elegibilidade anti-SPAM."""
    total: int
    ready_for_contact: int
    in_cooldown: int


class PncpLeadListResponse(BaseModel):
    """Resposta paginada da listagem de leads do PNCP."""
    items: List[PncpLeadResponse]
    total: int
    skip: int
    limit: int
    stats: PncpLeadStats


class PncpLeadSyncRequest(BaseModel):
    """Parâmetros para sincronização de leads via API pública do PNCP."""
    uf: Optional[str] = Field(None, min_length=2, max_length=2)
    dias_retroativos: int = Field(7, ge=1, le=90)
    codigo_modalidade: int = Field(6, ge=1)
    max_paginas: int = Field(2, ge=1, le=20)
    tamanho_pagina: int = Field(50, ge=1, le=500)

    @field_validator("uf", mode="before")
    @classmethod
    def normalize_uf(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = str(v).strip().upper()
        return cleaned or None


class PncpLeadSyncResponse(BaseModel):
    """Resumo da execução de sincronização com o PNCP."""
    fetched: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = Field(default_factory=list)
