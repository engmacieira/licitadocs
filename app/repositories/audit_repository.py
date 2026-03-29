import structlog
from app.core.database import SessionLocal
from app.models.audit_log_model import AuditLog
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Tuple

logger = structlog.get_logger("business.audit")

class AuditRepository:
    @classmethod
    def create_audit_log_async(
        cls,
        entity_name: str,
        entity_id: str,
        action: str,
        user_id: str,
        old_payload: dict,
        new_payload: dict,
        request_id: str
    ):
        """
        Salva um log de auditoria em uma sessão separada.
        Idealmente executado como uma BackgroundTask ou Thread secundária.
        """
        try:
            db = SessionLocal()
            audit_log = AuditLog(
                entity_name=entity_name,
                entity_id=entity_id,
                action=action,
                user_id=user_id,
                old_payload=old_payload,
                new_payload=new_payload,
                request_id=request_id
            )
            db.add(audit_log)
            db.commit()

            logger.info("audit_log_created", entity=entity_name, action=action, entity_id=entity_id)
        except Exception as e:
            if 'db' in locals():
                db.rollback()
            logger.error("audit_log_failed", error=str(e), entity=entity_name, action=action)
        finally:
            if 'db' in locals():
                db.close()

    @classmethod
    def get_audit_logs(
        cls,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        request_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[AuditLog], int]:
        """
        Busca os logs de auditoria com paginação e filtros dinâmicos.
        """
        query = db.query(AuditLog)

        if entity_name:
            query = query.filter(AuditLog.entity_name == entity_name)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if request_id:
            query = query.filter(AuditLog.request_id == request_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        # Ordenar pelos mais recentes
        query = query.order_by(AuditLog.created_at.desc())

        total = query.count()
        logs = query.offset(skip).limit(limit).all()

        return logs, total
