"""
Serviço de Notificação de Vencimento e Irregularidade Documental (US-2806).
Orquestra alertas automáticos via WhatsApp, E-mail e Central de Mensagens
com deduplicação por janela de tempo na tabela `messages`.
"""

import html
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.company_model import Company
from app.models.message_model import Message
from app.repositories.document_repository import DocumentRepository
from app.services.email_service import EmailService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger("app.services.document_notification_service")

EXPIRING_SUBJECT_PREFIX = "[Alerta Vencimento]"
IRREGULAR_SUBJECT_PREFIX = "[Alerta Irregularidade]"


class DocumentNotificationService:
    """Serviço responsável pelo disparo de alertas de documentos próximos do vencimento ou irregulares."""

    @staticmethod
    def _format_expiration_date(exp_date: Any) -> Optional[str]:
        if hasattr(exp_date, "strftime"):
            return exp_date.strftime("%d/%m/%Y")
        if exp_date:
            return str(exp_date)
        return None

    @staticmethod
    def _build_subject_and_content(
        alert_type: str,
        doc_title: str,
        company_name: str,
        filename: Optional[str],
        exp_date_str: Optional[str],
        status: Optional[str],
    ) -> tuple[str, str, str]:
        """Retorna (subject, text_content, html_content) para o alerta."""
        if alert_type == "expiring":
            prefix = EXPIRING_SUBJECT_PREFIX
            headline = "Documento próximo do vencimento"
            detail_line = (
                f"Data de vencimento: {exp_date_str}."
                if exp_date_str
                else "Verifique a data de vencimento na plataforma."
            )
        else:
            prefix = IRREGULAR_SUBJECT_PREFIX
            headline = "Irregularidade identificada no documento"
            detail_line = f"Status atual: {status or 'irregular'}."

        subject = f"{prefix} {doc_title}"
        text_lines = [
            f"{headline} - {company_name}",
            f"Documento: {doc_title}",
        ]
        if filename:
            text_lines.append(f"Arquivo: {filename}")
        text_lines.append(detail_line)
        text_lines.append("Acesse a plataforma LicitaDocs para verificar e regularizar.")
        text_content = "\n".join(text_lines)

        safe_headline = html.escape(headline)
        safe_company = html.escape(company_name)
        safe_title = html.escape(doc_title)
        safe_detail = html.escape(detail_line)
        file_html = (
            f"<p><strong>Arquivo:</strong> {html.escape(filename)}</p>"
            if filename
            else ""
        )

        html_content = (
            f"<html><body style=\"font-family: Arial, sans-serif; color: #1f2937;\">"
            f"<h2>LicitaDocs - {safe_headline}</h2>"
            f"<p><strong>Empresa:</strong> {safe_company}</p>"
            f"<p><strong>Documento:</strong> {safe_title}</p>"
            f"{file_html}"
            f"<p>{safe_detail}</p>"
            f"<p>Acesse a plataforma LicitaDocs para verificar e regularizar a situação.</p>"
            f"</body></html>"
        )
        return subject, text_content, html_content

    @staticmethod
    def _has_recent_notification(
        db: Session,
        company_id: str,
        doc_id: str,
        subject_prefix: str,
        cooldown_days: int,
    ) -> bool:
        """Verifica se já existe alerta ativo dentro da janela de deduplicação."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=cooldown_days)
        existing = (
            db.query(Message.id)
            .filter(
                Message.deleted_at.is_(None),
                Message.company_id == company_id,
                Message.related_document_id == doc_id,
                Message.message_type == "system",
                Message.subject.startswith(subject_prefix),
                Message.created_at >= cutoff,
            )
            .first()
        )
        return existing is not None

    @staticmethod
    async def notify_expiring_and_irregular_documents(
        db: Session,
        days_threshold: Optional[int] = None,
        dry_run: bool = False,
        irregular_cooldown_days: int = 1,
    ) -> Dict[str, Any]:
        """
        Busca documentos próximos do vencimento e irregulares, aplica deduplicação
        e dispara alertas via WhatsApp, E-mail e tabela Message.
        """
        days = (
            days_threshold
            if days_threshold is not None
            else settings.DOCUMENT_EXPIRATION_ALERT_DAYS
        )

        expiring_docs: List[dict] = DocumentRepository.get_expiring_global(
            db, days_threshold=days
        )
        irregular_docs: List[dict] = DocumentRepository.get_irregular_global(db)

        active_companies = (
            db.query(Company)
            .options(joinedload(Company.owner))
            .filter(Company.deleted_at.is_(None), Company.is_active == True)
            .all()
        )
        companies_map = {c.id: c for c in active_companies}

        notifications_sent = 0
        whatsapp_sent = 0
        email_sent = 0
        skipped_duplicates = 0
        skipped_no_contact = 0

        batches = [
            ("expiring", EXPIRING_SUBJECT_PREFIX, expiring_docs, max(1, days)),
            (
                "irregular",
                IRREGULAR_SUBJECT_PREFIX,
                irregular_docs,
                max(1, irregular_cooldown_days),
            ),
        ]

        for alert_type, prefix, docs, cooldown_days in batches:
            for doc in docs:
                doc_id = doc.get("id")
                company_id = doc.get("company_id")
                if not doc_id or not company_id:
                    continue

                company = companies_map.get(company_id)
                if company is None:
                    continue

                if DocumentNotificationService._has_recent_notification(
                    db=db,
                    company_id=company_id,
                    doc_id=doc_id,
                    subject_prefix=prefix,
                    cooldown_days=cooldown_days,
                ):
                    skipped_duplicates += 1
                    continue

                raw_phone = (
                    company.whatsapp
                    or company.telefone
                    or (company.owner.celular if company.owner else None)
                )
                raw_email = (
                    company.email_corporativo
                    or (company.owner.email if company.owner else None)
                )

                phone_clean = (
                    raw_phone.strip()
                    if isinstance(raw_phone, str) and raw_phone.strip()
                    else None
                )
                valid_phone = (
                    phone_clean
                    if WhatsAppService.normalize_phone(phone_clean) is not None
                    else None
                )
                valid_email = (
                    raw_email.strip()
                    if isinstance(raw_email, str) and "@" in raw_email.strip()
                    else None
                )

                if not valid_phone and not valid_email:
                    skipped_no_contact += 1
                    continue

                if dry_run:
                    continue

                doc_title = doc.get("title") or doc.get("filename") or "Documento"
                company_name = (
                    doc.get("company_name")
                    or company.razao_social
                    or "Empresa"
                )
                exp_date_str = DocumentNotificationService._format_expiration_date(
                    doc.get("expiration_date")
                )

                subject, text_content, html_content = (
                    DocumentNotificationService._build_subject_and_content(
                        alert_type=alert_type,
                        doc_title=doc_title,
                        company_name=company_name,
                        filename=doc.get("filename"),
                        exp_date_str=exp_date_str,
                        status=doc.get("status"),
                    )
                )

                if valid_phone:
                    wa_ok = await WhatsAppService.send_document_alert(
                        phone=valid_phone,
                        company_name=company_name,
                        document_title=doc_title,
                        alert_type=alert_type,
                        expiration_date=exp_date_str,
                    )
                    if wa_ok:
                        whatsapp_sent += 1

                if valid_email:
                    email_ok = await EmailService.send_email(
                        to_email=valid_email,
                        subject=subject,
                        html_content=html_content,
                    )
                    if email_ok:
                        email_sent += 1

                db.add(
                    Message(
                        company_id=company_id,
                        sender_id=None,
                        subject=subject,
                        content=text_content,
                        message_type="system",
                        related_document_id=doc_id,
                    )
                )
                notifications_sent += 1

        if not dry_run and notifications_sent > 0:
            db.commit()

        return {
            "days_threshold": days,
            "total_expiring": len(expiring_docs),
            "total_irregular": len(irregular_docs),
            "notifications_sent": notifications_sent,
            "whatsapp_sent": whatsapp_sent,
            "email_sent": email_sent,
            "skipped_duplicates": skipped_duplicates,
            "skipped_no_contact": skipped_no_contact,
            "dry_run": dry_run,
        }
