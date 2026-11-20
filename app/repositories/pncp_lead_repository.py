"""
Repositório de Leads PNCP.
Gerencia persistência, filtros de prospecção, upsert seguro e controle anti-SPAM.
"""

import re
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import and_, case, func, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.pncp_lead_model import PncpLead
from app.repositories.base_repository import BaseRepository
from app.schemas.pncp_lead_schemas import (
    PncpLeadStats,
    PncpLeadUpsert,
    compute_cooldown_status,
)


class PncpLeadRepository(BaseRepository[PncpLead]):
    """Repositório para operações de banco da entidade PncpLead."""

    model = PncpLead

    @staticmethod
    def normalize_cnpj(cnpj: str) -> str:
        """Remove caracteres não numéricos do CNPJ."""
        return re.sub(r"\D", "", cnpj or "")

    @classmethod
    def get_by_cnpj(cls, db: Session, cnpj: str) -> Optional[PncpLead]:
        """Busca lead ativo por CNPJ normalizado (14 dígitos)."""
        normalized = cls.normalize_cnpj(cnpj)
        if not normalized:
            return None
        return cls.get_active_query(db).filter(cls.model.cnpj == normalized).first()

    @classmethod
    def _build_cooldown_expressions(cls, default_cooldown_days: int, now_utc: datetime):
        """Constrói expressões SQL (PostgreSQL) para elegibilidade anti-SPAM."""
        effective_days = func.coalesce(cls.model.spam_cooldown_days, default_cooldown_days)
        cooldown_until = cls.model.last_contacted_at + func.make_interval(0, 0, 0, effective_days)

        in_cooldown_expr = and_(
            cls.model.last_contacted_at.isnot(None),
            effective_days > 0,
            cooldown_until > now_utc,
        )
        ready_expr = or_(
            cls.model.last_contacted_at.is_(None),
            effective_days <= 0,
            cooldown_until <= now_utc,
        )
        return in_cooldown_expr, ready_expr

    @classmethod
    def list_filtered(
        cls,
        db: Session,
        search: Optional[str] = None,
        uf: Optional[str] = None,
        contact_status: Optional[str] = None,
        default_cooldown_days: int = 7,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[PncpLead], int, PncpLeadStats]:
        """
        Lista leads ativos com busca textual, filtro por UF, filtro anti-SPAM
        e estatísticas agregadas de elegibilidade.
        """
        base_query = cls.get_active_query(db)

        if search and search.strip():
            term = search.strip()
            pattern = f"%{term}%"
            digits = cls.normalize_cnpj(term)
            search_filters = [
                cls.model.cnpj.ilike(pattern),
                cls.model.razao_social.ilike(pattern),
                cls.model.nome_fantasia.ilike(pattern),
                cls.model.email.ilike(pattern),
            ]
            if digits:
                search_filters.append(cls.model.cnpj.ilike(f"%{digits}%"))
            base_query = base_query.filter(or_(*search_filters))

        if uf and uf.strip():
            base_query = base_query.filter(cls.model.uf == uf.strip().upper())

        now_utc = datetime.now(timezone.utc)
        in_cooldown_expr, ready_expr = cls._build_cooldown_expressions(
            default_cooldown_days,
            now_utc,
        )

        stats_row = base_query.with_entities(
            func.count(cls.model.id).label("total"),
            func.coalesce(func.sum(case((in_cooldown_expr, 1), else_=0)), 0).label("in_cooldown"),
        ).first()

        stats_total = int(stats_row.total or 0) if stats_row else 0
        stats_in_cooldown = int(stats_row.in_cooldown or 0) if stats_row else 0
        stats = PncpLeadStats(
            total=stats_total,
            ready_for_contact=max(0, stats_total - stats_in_cooldown),
            in_cooldown=stats_in_cooldown,
        )

        filtered_query = base_query
        if contact_status:
            normalized_status = contact_status.strip().lower()
            if normalized_status == "ready":
                filtered_query = filtered_query.filter(ready_expr)
            elif normalized_status == "cooldown":
                filtered_query = filtered_query.filter(in_cooldown_expr)
            elif normalized_status == "never_contacted":
                filtered_query = filtered_query.filter(cls.model.last_contacted_at.is_(None))

        total = filtered_query.count()
        items = (
            filtered_query.order_by(cls.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total, stats

    @classmethod
    def upsert_from_pncp(
        cls,
        db: Session,
        lead_data: PncpLeadUpsert,
    ) -> tuple[PncpLead, bool]:
        """
        Insere ou atualiza um lead capturado do PNCP.
        Em atualizações, preserva SEMPRE os campos de histórico e controle anti-SPAM.
        Retorna (lead, created).
        """
        normalized_cnpj = cls.normalize_cnpj(lead_data.cnpj)
        existing = cls.get_by_cnpj(db, normalized_cnpj)

        try:
            if existing:
                existing.razao_social = lead_data.razao_social
                if lead_data.nome_fantasia:
                    existing.nome_fantasia = lead_data.nome_fantasia
                if lead_data.email:
                    existing.email = lead_data.email
                if lead_data.telefone:
                    existing.telefone = lead_data.telefone
                if lead_data.uf:
                    existing.uf = lead_data.uf
                if lead_data.municipio:
                    existing.municipio = lead_data.municipio
                if lead_data.porte:
                    existing.porte = lead_data.porte
                if lead_data.origem_pncp:
                    existing.origem_pncp = lead_data.origem_pncp

                db.add(existing)
                db.commit()
                db.refresh(existing)
                return existing, False

            new_lead = cls.model(
                cnpj=normalized_cnpj,
                razao_social=lead_data.razao_social,
                nome_fantasia=lead_data.nome_fantasia,
                email=lead_data.email,
                telefone=lead_data.telefone,
                uf=lead_data.uf,
                municipio=lead_data.municipio,
                porte=lead_data.porte,
                origem_pncp=lead_data.origem_pncp,
            )
            db.add(new_lead)
            db.commit()
            db.refresh(new_lead)
            return new_lead, True
        except SQLAlchemyError as exc:
            db.rollback()
            raise ValueError(f"Erro ao salvar lead PNCP: {str(exc)}") from exc

    @classmethod
    def register_contact(
        cls,
        db: Session,
        lead_id: str,
        channel: str,
        notes: Optional[str] = None,
        cooldown_days: Optional[int] = None,
    ) -> tuple[Optional[PncpLead], bool]:
        """
        Registra um contato realizado com o lead e atualiza metadados anti-SPAM.
        Retorna (lead_atualizado, was_in_cooldown).
        """
        lead = cls.get_by_id(db, lead_id)
        if not lead:
            return None, False

        effective_cooldown = (
            lead.spam_cooldown_days if lead.spam_cooldown_days is not None else 7
        )
        was_in_cooldown, _ = compute_cooldown_status(
            lead.last_contacted_at,
            effective_cooldown,
        )

        try:
            lead.last_contacted_at = datetime.now(timezone.utc)
            lead.contact_count = (lead.contact_count or 0) + 1
            lead.last_contact_channel = channel.strip()
            lead.last_contact_notes = notes
            if cooldown_days is not None:
                lead.spam_cooldown_days = cooldown_days

            db.add(lead)
            db.commit()
            db.refresh(lead)
            return lead, was_in_cooldown
        except SQLAlchemyError as exc:
            db.rollback()
            raise ValueError(f"Erro ao registrar contato do lead: {str(exc)}") from exc
